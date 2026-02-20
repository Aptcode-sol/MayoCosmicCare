const { Worker } = require('bullmq');
const IORedis = require('ioredis');

const REDIS_ENABLED = process.env.REDIS_ENABLED === 'true';

if (REDIS_ENABLED) {
    const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

    try {
        const connection = new IORedis(redisUrl, {
            maxRetriesPerRequest: null,
            lazyConnect: true
        });

        const worker = new Worker('receipt-email', async (job) => {
            const { orderId } = job.data;
            console.log(`[RECEIPT-WORKER] Processing receipt email for order: ${orderId}`);

            try {
                const { getOrderDataForReceipt, renderReceiptHtml, generateReceiptPdf } = require('../../services/receiptService');
                const { sendReceiptEmail } = require('../../services/emailService');
                const prisma = require('../../prismaClient');

                // Fetch order data
                const orderData = await getOrderDataForReceipt(orderId);

                // Get user email
                const order = await prisma.order.findUnique({
                    where: { id: orderId },
                    include: { user: true }
                });

                if (!order || !order.user) {
                    throw new Error('Order or user not found');
                }

                // Generate HTML and PDF
                const html = renderReceiptHtml(orderData);
                const pdfBuffer = await generateReceiptPdf(orderData);

                // Send email with PDF attachment
                await sendReceiptEmail(
                    order.user.email,
                    orderData.receiptNo,
                    html,
                    pdfBuffer
                );

                console.log(`[RECEIPT-WORKER] Receipt email sent for order: ${orderId}`);
                return { success: true, orderId };
            } catch (err) {
                console.error(`[RECEIPT-WORKER] Failed for order ${orderId}:`, err.message);
                throw err; // Let BullMQ retry
            }
        }, {
            connection,
            concurrency: 2,
            limiter: {
                max: 5,
                duration: 60000 // Max 5 emails per minute to avoid SMTP throttling
            }
        });

        worker.on('completed', (job) => {
            console.log(`[RECEIPT-WORKER] Job ${job.id} completed for order: ${job.data.orderId}`);
        });

        worker.on('failed', (job, err) => {
            console.error(`[RECEIPT-WORKER] Job ${job?.id} failed:`, err.message);
        });

        console.log('[RECEIPT-WORKER] Receipt email worker started');
    } catch (err) {
        console.warn('[RECEIPT-WORKER] Could not start receipt worker:', err.message);
    }
} else {
    console.log('[RECEIPT-WORKER] Redis not enabled, receipt email worker not started');
}
