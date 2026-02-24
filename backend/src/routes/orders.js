const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');

// Get User's Orders
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const orders = await prisma.order.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                items: {
                    include: { product: true }
                }
            }
        });
        res.json(orders);
    } catch (error) {
        console.error('Get Orders Error:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// Get purchase details from a transaction ID (resolves product info)
// MUST be before /:id to avoid route collision
router.get('/purchase/:txId', async (req, res) => {
    try {
        const userId = req.user.id;
        const txId = req.params.txId;

        const tx = await prisma.transaction.findUnique({
            where: { id: txId }
        });

        if (!tx) return res.status(404).json({ error: 'Transaction not found' });
        if (tx.userId !== userId) return res.status(403).json({ error: 'Unauthorized' });
        if (tx.type !== 'PURCHASE') return res.status(400).json({ error: 'Not a purchase transaction' });

        // Extract product name from detail string (e.g. "Purchase Standard Mattress")
        let product = null;
        if (tx.detail) {
            const productName = tx.detail.replace(/^Purchase\s+/i, '').trim();
            product = await prisma.product.findFirst({
                where: { name: { equals: productName, mode: 'insensitive' } }
            });
        }

        // Try to find a matching Order record (same user, same amount, close date)
        let orderId = null;
        const txDate = new Date(tx.createdAt);
        const minDate = new Date(txDate.getTime() - 60000); // 1 min before
        const maxDate = new Date(txDate.getTime() + 60000); // 1 min after
        const matchingOrder = await prisma.order.findFirst({
            where: {
                userId,
                totalAmount: tx.amount,
                status: 'PAID',
                createdAt: { gte: minDate, lte: maxDate }
            },
            select: { id: true }
        });
        if (matchingOrder) orderId = matchingOrder.id;

        res.json({
            transaction: tx,
            product,
            orderId
        });
    } catch (error) {
        console.error('Get Purchase Detail Error:', error);
        res.status(500).json({ error: 'Failed to fetch purchase details' });
    }
});

// Get Single Order Detail
router.get('/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const orderId = req.params.id;

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: {
                    include: { product: true }
                }
            }
        });

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        if (order.userId !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        res.json(order);
    } catch (error) {
        console.error('Get Order Detail Error:', error);
        res.status(500).json({ error: 'Failed to fetch order details' });
    }
});

module.exports = router;
