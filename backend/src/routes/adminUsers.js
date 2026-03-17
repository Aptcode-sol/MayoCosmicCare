const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
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
                    createdAt: true,
                    wallet: { select: { balance: true } }
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
            rightBV: u.rightBV || 0,
            walletBalance: u.wallet?.balance || 0
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

// Get single user profile with full stats (admin only)
router.get('/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch user with wallet and referrals
        const user = await prisma.user.findUnique({
            where: { id },
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
                rank: true,
                totalPairs: true,
                position: true,
                createdAt: true,
                wallet: { select: { balance: true } },
                sponsor: { select: { id: true, username: true, name: true, email: true, phone: true } },
                parent: { select: { id: true, username: true } },
                referrals: {
                    select: { id: true, position: true, isBlocked: true, hasPurchased: true }
                }
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Direct referral stats
        const directLeft = user.referrals.filter(r => r.position === 'LEFT').length;
        const directRight = user.referrals.filter(r => r.position === 'RIGHT').length;
        const directTotal = user.referrals.length;
        const directActiveLeft = user.referrals.filter(r => r.position === 'LEFT' && !r.isBlocked && r.hasPurchased).length;
        const directActiveRight = user.referrals.filter(r => r.position === 'RIGHT' && !r.isBlocked && r.hasPurchased).length;
        const directActiveTotal = user.referrals.filter(r => !r.isBlocked && r.hasPurchased).length;

        // Total team via tree traversal
        const allPlacement = await prisma.user.findMany({
            select: { id: true, parentId: true, position: true, hasPurchased: true, isBlocked: true }
        });
        const childrenMap = new Map();
        for (const u of allPlacement) {
            if (u.parentId) {
                if (!childrenMap.has(u.parentId)) childrenMap.set(u.parentId, []);
                childrenMap.get(u.parentId).push(u);
            }
        }
        function countDescendants(nodeId) {
            let count = 0, activeCount = 0;
            const children = childrenMap.get(nodeId) || [];
            for (const child of children) {
                count += 1;
                if (child.hasPurchased && !child.isBlocked) activeCount += 1;
                const sub = countDescendants(child.id);
                count += sub.total;
                activeCount += sub.active;
            }
            return { total: count, active: activeCount };
        }
        const immediateChildren = childrenMap.get(id) || [];
        const leftChild = immediateChildren.find(c => c.position === 'LEFT');
        const rightChild = immediateChildren.find(c => c.position === 'RIGHT');
        const leftResult = leftChild ? countDescendants(leftChild.id) : { total: 0, active: 0 };
        const rightResult = rightChild ? countDescendants(rightChild.id) : { total: 0, active: 0 };
        const leftMembers = leftChild ? 1 + leftResult.total : 0;
        const rightMembers = rightChild ? 1 + rightResult.total : 0;
        const activeLeftMembers = leftChild ? (leftChild.hasPurchased && !leftChild.isBlocked ? 1 : 0) + leftResult.active : 0;
        const activeRightMembers = rightChild ? (rightChild.hasPurchased && !rightChild.isBlocked ? 1 : 0) + rightResult.active : 0;

        // Earnings breakdown
        const earningsAgg = await prisma.transaction.groupBy({
            by: ['type'],
            where: { userId: id },
            _sum: { amount: true }
        });
        let directBonus = 0, matchingBonus = 0, leadershipBonus = 0;
        earningsAgg.forEach(agg => {
            if (agg.type === 'DIRECT_BONUS') directBonus = agg._sum.amount || 0;
            if (agg.type === 'MATCHING_BONUS') matchingBonus = agg._sum.amount || 0;
            if (agg.type === 'LEADERSHIP_BONUS') leadershipBonus = agg._sum.amount || 0;
        });

        // Recent transactions
        const recentTransactions = await prisma.transaction.findMany({
            where: { userId: id },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        // Recent orders
        const recentOrders = await prisma.order.findMany({
            where: { userId: id },
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
                items: {
                    include: { product: { select: { name: true } } }
                }
            }
        });

        res.json({
            ok: true,
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                isBlocked: user.isBlocked,
                hasPurchased: user.hasPurchased,
                fraudFlag: user.fraudFlag,
                rank: user.rank,
                totalPairs: user.totalPairs,
                position: user.position,
                createdAt: user.createdAt,
                walletBalance: user.wallet?.balance || 0,
                sponsor: user.sponsor,
                parent: user.parent
            },
            teamStats: {
                directTeam: {
                    total: directTotal,
                    left: directLeft,
                    right: directRight,
                    activeTotal: directActiveTotal,
                    activeLeft: directActiveLeft,
                    activeRight: directActiveRight
                },
                totalTeam: {
                    leftMembers,
                    rightMembers,
                    activeLeft: activeLeftMembers,
                    activeRight: activeRightMembers,
                    leftBV: user.leftBV || 0,
                    rightBV: user.rightBV || 0
                }
            },
            earnings: {
                directBonus,
                matchingBonus,
                leadershipBonus,
                totalEarnings: directBonus + matchingBonus + leadershipBonus
            },
            recentTransactions,
            recentOrders
        });
    } catch (err) {
        console.error('Admin User Profile Error:', err);
        res.status(500).json({ error: 'Failed to fetch user profile' });
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

// Reset user password (admin only)
router.patch('/:id/reset-password', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;

        if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null,
                otpCode: null,
                otpExpiry: null
            }
        });

        await prisma.auditLog.create({
            data: {
                action: 'User password reset',
                actorId: req.user.id,
                meta: JSON.stringify({ targetUserId: id })
            }
        });

        res.json({ ok: true, message: 'Password reset successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to reset password' });
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
