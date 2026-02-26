const express = require('express');
const router = express.Router();
const paymentService = require('../services/paymentService');
const { info, error } = require('../logger');
// POST /api/payment/create-order
router.post('/create-order', async (req, res) => {
    try {
        const CASHFREE_ENV = process.env.CASHFREE_ENV || 'SANDBOX';
        info(CASHFREE_ENV, "in the EC2")
        const userId = req.user.id; // Provided by authMiddleware
        const { items, sponsorId } = req.body; // items: [{productId, quantity, price}]

        const result = await paymentService.createOrder(userId, items, sponsorId);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// POST /api/payment/verify
router.post('/verify', async (req, res) => {
    try {
        const { orderId } = req.body;
        const result = await paymentService.verifyOrder(orderId);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
