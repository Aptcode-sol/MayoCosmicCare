const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all rank changes with optional filters
router.get('/', authenticate, requireAdmin, async (req, res) => {
    try {
        const { rank, rewarded } = req.query;

        const where = {};
        if (rank && rank !== 'all') {
            where.toRank = rank;
        }
        if (rewarded === 'pending') {
            where.rewarded = false;
        } else if (rewarded === 'rewarded') {
            where.rewarded = true;
        }

        const rankChanges = await prisma.rankChange.findMany({
            where,
            include: {
                user: {
                    select: { id: true, username: true, email: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ ok: true, rankChanges });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch position changes' });
    }
});

// Mark a rank change as rewarded
router.patch('/:id/reward', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { rewarded } = req.body;

        const rankChange = await prisma.rankChange.update({
            where: { id },
            data: {
                rewarded: Boolean(rewarded),
                rewardedAt: rewarded ? new Date() : null,
                rewardedBy: rewarded ? req.user.id : null
            }
        });

        await prisma.auditLog.create({
            data: {
                action: `Position reward ${rewarded ? 'marked' : 'unmarked'}`,
                actorId: req.user.id,
                meta: JSON.stringify({ rankChangeId: id, toRank: rankChange.toRank })
            }
        });

        res.json({ ok: true, rankChange });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update reward status' });
    }
});

module.exports = router;
