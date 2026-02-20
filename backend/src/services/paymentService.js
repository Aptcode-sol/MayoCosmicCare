const axios = require('axios');
const prisma = require('../prismaClient');
const { purchaseProduct } = require('./purchaseService');

const CASHFREE_CLIENT_ID = process.env.CASHFREE_CLIENT_ID;
const CASHFREE_CLIENT_SECRET = process.env.CASHFREE_CLIENT_SECRET;
const CASHFREE_ENV = process.env.CASHFREE_ENV || 'SANDBOX';
const BASE_URL = CASHFREE_ENV === 'PROD'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg';

const API_VERSION = '2023-08-01'; // As per docs

async function getHeaders() {
    const clientId = process.env.CASHFREE_PG_APP_ID;
    const clientSecret = process.env.CASHFREE_PG_SECRET_KEY;

    if (!clientId || !clientSecret) {
        console.error('[PAYMENT] Missing PG Credentials:', { clientId: !!clientId, clientSecret: !!clientSecret });
        throw new Error('Cashfree Payment Gateway Credentials Missing in Environment');
    }

    return {
        'x-client-id': clientId,
        'x-client-secret': clientSecret,
        'x-api-version': API_VERSION,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };
}

/**
 * Create Order in Cashfree and Local DB
 * @param {string} userId - Buyer ID
 * @param {Array} items - Array of { productId, quantity, price }
 * @param {string} sponsorId - Optional new sponsor ID for placement context
 */
async function createOrder(userId, items, sponsorId = null) {
    if (!items || items.length === 0) throw new Error('No items in order');

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    // KYC Check enforced here too
    const isFirstAdmin = user.role === 'ADMIN' && (await prisma.user.count()) === 1;
    if (!isFirstAdmin && user.kycStatus !== 'VERIFIED') {
        throw new Error('KYC Verification Required to create order.');
    }

    // Calculate total
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const orderId = 'ORDER_' + userId.slice(-6) + '_' + Date.now();

    // Create Order in DB first (Pending)
    const dbOrder = await prisma.order.create({
        data: {
            userId,
            totalAmount,
            status: 'PENDING',
            cashfreeOrderId: orderId,
            sponsorId,
            items: {
                create: items.map(item => ({
                    productId: item.productId,
                    price: item.price,
                    quantity: item.quantity
                }))
            }
        }
    });

    // Create Cashfree Order
    // Valid return URL is needed? Client SDK handles redirect?
    // Docs say: "We recommend that you provide a return URL...".
    // Return URL should point to frontend confirmation page?
    const returnUrl = process.env.FRONTEND_URL
        ? `${process.env.FRONTEND_URL}/checkout/status?order_id={order_id}`
        : `http://localhost:3000/checkout/status?order_id={order_id}`;

    const payload = {
        order_amount: totalAmount,
        order_currency: "INR",
        order_id: orderId,
        customer_details: {
            customer_id: userId,
            customer_name: user.username || "Customer", // Phone/Email optional but good
            customer_email: user.email,
            customer_phone: user.phone || '9999999999'
        },
        order_meta: {
            return_url: returnUrl
        }
        // order_note: ""
    };

    try {
        const response = await axios.post(`${BASE_URL}/orders`, payload, {
            headers: await getHeaders()
        });

        const { payment_session_id } = response.data;

        await prisma.order.update({
            where: { id: dbOrder.id },
            data: { paymentSessionId: payment_session_id }
        });

        return {
            payment_session_id,
            order_id: orderId
        };

    } catch (error) {
        console.error('[PAYMENT] Create Order Failed:', error.response?.data || error.message);
        // Fail the DB order or just leave pending (it will stale)
        await prisma.order.update({
            where: { id: dbOrder.id },
            data: { status: 'FAILED' }
        });
        throw new Error('Payment Gateway Error: ' + (error.response?.data?.message || error.message));
    }
}

/**
 * Verify Order Status and Fulfill
 * @param {string} orderId - Cashfree Order ID
 */
async function verifyOrder(orderId) {
    // Check DB order
    const dbOrder = await prisma.order.findUnique({
        where: { cashfreeOrderId: orderId },
        include: { items: true }
    });

    if (!dbOrder) throw new Error('Order not found');
    if (dbOrder.status === 'PAID') return { status: 'PAID', message: 'Already processed', dbOrderId: dbOrder.id };

    try {
        const response = await axios.get(`${BASE_URL}/orders/${orderId}`, {
            headers: await getHeaders()
        });

        const cfOrder = response.data;
        // Check order_status
        if (cfOrder.order_status === 'PAID') {

            // Fulfill the order
            console.log('[PAYMENT] Order PAID. Fulfilling...');

            // Update status PAID
            await prisma.order.update({
                where: { id: dbOrder.id },
                data: { status: 'PAID' }
            });

            // Process items
            // Assuming "purchaseProduct" handles single item logic.
            // Loop through items.
            for (const item of dbOrder.items) {
                // Determine leg? logic is inside purchaseProduct if newSponsor is passed.
                // But purchaseProduct logic handles ONE new user placement.
                // If user buys 5 items, we don't place them 5 times.
                // purchaseService has checks: "if (!userToCheck.sponsorId...)".
                // So calling it multiple times is safe; first call places, subsequent just add stock/BV.
                // We pass `dbOrder.sponsorId` as `newSponsorId`.

                await purchaseProduct(dbOrder.userId, item.productId, dbOrder.sponsorId);
            }

            // Auto-send receipt email after successful payment
            try {
                const { addReceiptEmailJob } = require('../queues/queue');
                await addReceiptEmailJob(dbOrder.id);
                console.log('[PAYMENT] Receipt email queued for order:', orderId);
            } catch (receiptErr) {
                // Don't fail the payment verification if receipt email fails
                console.error('[PAYMENT] Receipt email enqueue failed:', receiptErr.message);
            }

            return { status: 'PAID', orderId, dbOrderId: dbOrder.id };


        } else if (cfOrder.order_status === 'EXPIRED' || cfOrder.order_status === 'TERMINATED') { // Adjust based on docs?
            await prisma.order.update({
                where: { id: dbOrder.id },
                data: { status: 'FAILED' }
            });
            return { status: cfOrder.order_status };
        } else {
            return { status: cfOrder.order_status }; // PENDING or ACTIVE
        }

    } catch (error) {
        console.error('[PAYMENT] Verify Failed:', error.response?.data || error.message);
        throw new Error('Verification Failed');
    }
}

module.exports = { createOrder, verifyOrder };
