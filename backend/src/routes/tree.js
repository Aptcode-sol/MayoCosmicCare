const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authenticate } = require('../middleware/authMiddleware');

// return downline tree for the authenticated user (limited depth for demo)
router.get('/me', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;

        // Fetch first-level referrals
        const referrals = await prisma.user.findMany({ where: { sponsorId: userId } });

        // Fetch second level for each referral
        const nodes = await Promise.all(referrals.map(async (r) => {
            const children = await prisma.user.findMany({ where: { sponsorId: r.id } });
            return { id: r.id, username: r.username, position: r.position, children };
        }));

        res.json({ ok: true, tree: { id: userId, children: nodes } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ ok: false, error: 'Failed to fetch tree' });
    }
});

module.exports = router;
