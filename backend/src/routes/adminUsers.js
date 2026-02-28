const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();



// Get all users (admin only) - with pagination
router.get('/', authenticate, requireAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 25;
        const search = (req.query.search || '').trim();
        const status = req.query.status; // 'active', 'blocked', or 'all'
        const skip = (page - 1) * limit;

        const where = {};

        // Add search conditions
        if (search) {
            where.OR = [
                { username: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
                { id: { contains: search, mode: 'insensitive' } }
            ];
        }

        // Add status filter
        if (status === 'active') {
            where.isBlocked = false;
            where.hasPurchased = true;
        } else if (status === 'inactive') {
            where.isBlocked = false;
            where.hasPurchased = false;
        } else if (status === 'blocked') {
            where.isBlocked = true;
        }

        // Fetch users with member and carry counts for BV calculation
        const [usersRaw, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    username: true,
                    name: true,
                    email: true,
                    phone: true,
                    sponsorId: true,
                    role: true,
                    isBlocked: true,
                    hasPurchased: true,
                    fraudFlag: true,
                    leftBV: true,
                    rightBV: true,
                    leftMemberCount: true,
                    rightMemberCount: true,
                    leftCarryCount: true,
                    rightCarryCount: true,
                    createdAt: true
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.user.count({ where })
        ]);

        // Use actual BV from user record (accumulated from real product.bv per purchase)
        const users = usersRaw.map(u => ({
            ...u,
            leftBV: u.leftBV || 0,
            rightBV: u.rightBV || 0
        }));

        const totalPages = Math.ceil(total / limit);
        res.json({
            users,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Block/unblock user
router.patch('/:id/block', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { isBlocked } = req.body;

        const user = await prisma.user.update({
            where: { id },
            data: { isBlocked: Boolean(isBlocked) }
        });

        await prisma.auditLog.create({
            data: {
                action: `User ${isBlocked ? 'blocked' : 'unblocked'}`,
                actorId: req.user.id,
                meta: JSON.stringify({ targetUserId: id })
            }
        });

        res.json({ user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// Flag fraud
router.patch('/:id/fraud', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { fraudFlag } = req.body;

        const user = await prisma.user.update({
            where: { id },
            data: { fraudFlag: Boolean(fraudFlag) }
        });

        await prisma.auditLog.create({
            data: {
                action: `Fraud flag ${fraudFlag ? 'set' : 'cleared'}`,
                actorId: req.user.id,
                meta: JSON.stringify({ targetUserId: id })
            }
        });

        res.json({ user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update fraud flag' });
    }
});

// Approve/reject withdrawal
router.patch('/withdrawals/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // APPROVED or REJECTED

        if (!['APPROVED', 'REJECTED'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const withdrawal = await prisma.withdrawal.findUnique({ where: { id } });
        if (!withdrawal) {
            return res.status(404).json({ error: 'Withdrawal not found' });
        }

        if (withdrawal.status !== 'PENDING') {
            return res.status(400).json({ error: 'Withdrawal already processed' });
        }

        await prisma.$transaction(async (tx) => {
            if (status === 'APPROVED') {
                // Deduct from wallet
                await tx.wallet.update({
                    where: { userId: withdrawal.userId },
                    data: { balance: { decrement: withdrawal.amount } }
                });

                // Record transaction
                await tx.transaction.create({
                    data: {
                        userId: withdrawal.userId,
                        type: 'WITHDRAW',
                        amount: -withdrawal.amount,
                        detail: `Withdrawal approved by admin`
                    }
                });
            }

            // Update withdrawal status
            await tx.withdrawal.update({
                where: { id },
                data: {
                    status,
                    approvedAt: new Date(),
                    approvedBy: req.user.id
                }
            });

            await tx.auditLog.create({
                data: {
                    action: `Withdrawal ${status}`,
                    actorId: req.user.id,
                    meta: JSON.stringify({ withdrawalId: id, amount: withdrawal.amount })
                }
            });
        });

        res.json({ message: `Withdrawal ${status}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to process withdrawal' });
    }
});

// Get all pending withdrawals
router.get('/withdrawals', authenticate, requireAdmin, async (req, res) => {
    try {
        const withdrawals = await prisma.withdrawal.findMany({
            where: { status: 'PENDING' },
            include: {
                user: {
                    select: { id: true, username: true, email: true }
                }
            },
            orderBy: { createdAt: 'asc' }
        });
        res.json({ withdrawals });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch withdrawals' });
    }
});

// Get rank distribution statistics
router.get('/stats/ranks', authenticate, requireAdmin, async (req, res) => {
    try {
        const stats = await prisma.user.groupBy({
            by: ['rank'],
            _count: { rank: true }
        });

        // Convert to array of { rank: 'Manager', count: 10 }
        const formatted = stats.map(s => ({ rank: s.rank, count: s._count.rank }));
        res.json({ ok: true, stats: formatted });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch rank stats' });
    }
});


module.exports = router;
