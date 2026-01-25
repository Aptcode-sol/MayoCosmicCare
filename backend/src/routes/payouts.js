const express = require('express');
const router = express.Router();
const payoutService = require('../services/payoutService');

// POST /api/payouts/request
router.post('/request', async (req, res) => {
    try {
        const userId = req.user.id;
        const { amount, bankDetails } = req.body;
        // bankDetails expecting { accountInfo: { bankAccount, ifsc }, name, ... }

        const result = await payoutService.requestPayout(userId, amount, bankDetails);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

const { checkRole } = require('../middleware/roleMiddleware');

// GET /api/payouts/admin/list
router.get('/admin/list', checkRole(['ADMIN']), async (req, res) => {
    try {
        const { status } = req.query;
        const withdrawals = await payoutService.listWithdrawals(status);
        res.json({ withdrawals });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/payouts/approve/:id (Admin only)
// Should add admin check middleware 
router.post('/approve/:id', checkRole(['ADMIN']), async (req, res) => {
    try {
        const withdrawalId = req.params.id;
        const result = await payoutService.executePayout(withdrawalId);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// POST /api/payouts/status/:id (User/Admin) - Manual Status Check
router.post('/status/:id', async (req, res) => {
    try {
        const withdrawalId = req.params.id;
        // Optional: Ensure user owns this withdrawal if not admin
        const result = await payoutService.checkTransferStatus(withdrawalId);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// GET /api/payouts/my-list
router.get('/my-list', async (req, res) => {
    try {
        const userId = req.user.id;
        // Helper to list by user. We can reuse listWithdrawals if we modify it, 
        // but payoutService.listWithdrawals currently only filters by status.
        // Let's add specific logic or use prisma directly here for simplicity or create service method.
        // Better to use service for consistency. Let's assume we can add a simple query in route or modify service.
        // Modifying service is cleaner.
        const withdrawals = await prisma.withdrawal.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { username: true } } }
        });
        res.json({ withdrawals });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const prisma = require('../prismaClient'); // Require prisma for my-list if not using service method

module.exports = router;
