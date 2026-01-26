const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const { authenticate } = require('../middleware/authMiddleware');

// Admin-only middleware
const adminOnly = (req, res, next) => {
    if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({ ok: false, error: 'Admin access required' });
    }
    next();
};

// GET /api/admin/analytics/stats - Get comprehensive analytics data
router.get('/stats', authenticate, adminOnly, async (req, res) => {
    try {
        // Get date ranges
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        // 1. Users by Rank
        const usersByRank = await prisma.user.groupBy({
            by: ['rank'],
            _count: { id: true }
        });

        // 2. Total Bonus Amounts by Type
        const bonusTotals = await prisma.transaction.groupBy({
            by: ['type'],
            _sum: { amount: true },
            where: {
                type: { in: ['DIRECT_BONUS', 'MATCHING_BONUS'] }
            }
        });

        // 3. Withdrawal Stats
        const withdrawalStats = await prisma.withdrawal.groupBy({
            by: ['status'],
            _sum: { amount: true },
            _count: { id: true }
        });

        // 4. Daily new users (last 30 days)
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const dailyUsers = await prisma.$queryRaw`
            SELECT DATE("createdAt") as date, COUNT(*) as count
            FROM "User"
            WHERE "createdAt" >= ${thirtyDaysAgo}
            GROUP BY DATE("createdAt")
            ORDER BY date ASC
        `;

        // 5. Monthly user signups (last 12 months)
        const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        const monthlyUsers = await prisma.$queryRaw`
            SELECT TO_CHAR("createdAt", 'YYYY-MM') as month, COUNT(*) as count
            FROM "User"
            WHERE "createdAt" >= ${twelveMonthsAgo}
            GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
            ORDER BY month ASC
        `;

        // 6. Today's stats
        const todayUsers = await prisma.user.count({
            where: { createdAt: { gte: startOfToday } }
        });

        const todayBonuses = await prisma.transaction.aggregate({
            _sum: { amount: true },
            where: {
                createdAt: { gte: startOfToday },
                type: { in: ['DIRECT_BONUS', 'MATCHING_BONUS'] }
            }
        });

        // 7. Total users
        const totalUsers = await prisma.user.count();

        // 8. Monthly Bonus Trends (last 6 months)
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        const monthlyBonuses = await prisma.$queryRaw`
            SELECT 
                TO_CHAR("createdAt", 'YYYY-MM') as month,
                type,
                SUM(amount) as total
            FROM "Transaction"
            WHERE "createdAt" >= ${sixMonthsAgo}
            AND type IN ('DIRECT_BONUS', 'MATCHING_BONUS')
            GROUP BY TO_CHAR("createdAt", 'YYYY-MM'), type
            ORDER BY month ASC
        `;

        // 9. Monthly Withdrawals
        const monthlyWithdrawals = await prisma.$queryRaw`
            SELECT 
                TO_CHAR("createdAt", 'YYYY-MM') as month,
                SUM(amount) as total
            FROM "Withdrawal"
            WHERE "createdAt" >= ${sixMonthsAgo}
            AND status = 'APPROVED'
            GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
            ORDER BY month ASC
        `;

        res.json({
            ok: true,
            stats: {
                totalUsers,
                todayUsers,
                todayBonuses: todayBonuses._sum.amount || 0,
                usersByRank: usersByRank.map(r => ({ rank: r.rank, count: r._count.id })),
                bonusTotals: bonusTotals.map(b => ({ type: b.type, total: b._sum.amount || 0 })),
                withdrawalStats: withdrawalStats.map(w => ({
                    status: w.status,
                    total: w._sum.amount || 0,
                    count: w._count.id
                })),
                dailyUsers: dailyUsers.map(d => ({ date: d.date, count: Number(d.count) })),
                monthlyUsers: monthlyUsers.map(m => ({ month: m.month, count: Number(m.count) })),
                monthlyBonuses: monthlyBonuses.map(b => ({ month: b.month, type: b.type, total: Number(b.total) })),
                monthlyWithdrawals: monthlyWithdrawals.map(w => ({ month: w.month, total: Number(w.total) }))
            }
        });
    } catch (err) {
        console.error('[ADMIN_ANALYTICS]', err);
        res.status(500).json({ ok: false, error: 'Failed to fetch analytics' });
    }
});

// GET /api/admin/analytics/network - Get full binary tree for admin
router.get('/network', authenticate, adminOnly, async (req, res) => {
    try {
        // Get all users with their placement info
        const users = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                email: true,
                rank: true,
                hasPurchased: true,
                createdAt: true,
                parentId: true,
                position: true,
                leftMemberCount: true,
                rightMemberCount: true
            },
            orderBy: { createdAt: 'asc' }
        });

        res.json({ ok: true, users });
    } catch (err) {
        console.error('[ADMIN_NETWORK]', err);
        res.status(500).json({ ok: false, error: 'Failed to fetch network' });
    }
});

module.exports = router;
