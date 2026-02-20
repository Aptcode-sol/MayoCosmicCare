const express = require('express');
const router = express.Router();
const { getOrderDataForReceipt, renderReceiptHtml, generateReceiptPdf } = require('../services/receiptService');
const { addReceiptEmailJob } = require('../queues/queue');
const prisma = require('../prismaClient');

/**
 * GET /api/receipt/:orderId/download
 * Generate and download receipt PDF for an order
 */
router.get('/:orderId/download', async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        // Fetch order and verify ownership (admins can access any)
        const order = await prisma.order.findUnique({
            where: { id: orderId }
        });

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        if (order.userId !== userId && userRole !== 'ADMIN') {
            return res.status(403).json({ error: 'Access denied' });
        }

        if (order.status !== 'PAID') {
            return res.status(400).json({ error: 'Receipt only available for paid orders' });
        }

        // Generate receipt data and PDF
        const orderData = await getOrderDataForReceipt(orderId);
        const pdfBuffer = await generateReceiptPdf(orderData);

        // Set headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Receipt_${orderData.receiptNo}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('[RECEIPT] Download error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/receipt/:orderId/preview
 * Preview receipt as HTML (for browser viewing)
 */
router.get('/:orderId/preview', async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        const order = await prisma.order.findUnique({
            where: { id: orderId }
        });

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        if (order.userId !== userId && userRole !== 'ADMIN') {
            return res.status(403).json({ error: 'Access denied' });
        }

        if (order.status !== 'PAID') {
            return res.status(400).json({ error: 'Receipt only available for paid orders' });
        }

        const orderData = await getOrderDataForReceipt(orderId);
        const html = renderReceiptHtml(orderData);

        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    } catch (error) {
        console.error('[RECEIPT] Preview error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/receipt/:orderId/send-email
 * Queue or send receipt email for an order
 */
router.post('/:orderId/send-email', async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        const order = await prisma.order.findUnique({
            where: { id: orderId }
        });

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        if (order.userId !== userId && userRole !== 'ADMIN') {
            return res.status(403).json({ error: 'Access denied' });
        }

        if (order.status !== 'PAID') {
            return res.status(400).json({ error: 'Receipt email only available for paid orders' });
        }

        // Enqueue receipt email (or send synchronously if Redis not available)
        await addReceiptEmailJob(orderId);

        res.json({ success: true, message: 'Receipt email queued successfully' });
    } catch (error) {
        console.error('[RECEIPT] Send email error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
