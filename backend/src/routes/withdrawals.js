const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Request withdrawal (user protected)
router.post('/', authenticate, async (req, res) => {
    try {
        const { amount, bankDetails } = req.body;
        const userId = req.user.id;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        const wallet = await prisma.wallet.findUnique({ where: { userId } });
        if (!wallet || wallet.balance < amount) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        // Create withdrawal request
        const withdrawal = await prisma.withdrawal.create({
            data: { userId, amount, bankDetails, status: 'PENDING' }
        });

        res.json({ withdrawal });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Withdrawal request failed' });
    }
});

// Get user's withdrawals
router.get('/', authenticate, async (req, res) => {
    try {
        const withdrawals = await prisma.withdrawal.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ withdrawals });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch withdrawals' });
    }
});

module.exports = router;
