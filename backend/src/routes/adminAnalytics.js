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
        const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);

        // ===== USER METRICS =====
        const totalUsers = await prisma.user.count();
        const todayUsers = await prisma.user.count({ where: { createdAt: { gte: startOfToday } } });
        const weekUsers = await prisma.user.count({ where: { createdAt: { gte: startOfWeek } } });
        const monthUsers = await prisma.user.count({ where: { createdAt: { gte: startOfMonth } } });

        // Active users (users with purchases)
        const activeUsers = await prisma.user.count({ where: { hasPurchased: true } });
        const pendingUsers = await prisma.user.count({ where: { hasPurchased: false } });

        // ===== POSITION DISTRIBUTION =====
        const positionCounts = await prisma.user.groupBy({
            by: ['position'],
            _count: { id: true }
        });
        const usersByPosition = {
            LEFT: positionCounts.find(p => p.position === 'LEFT')?._count.id || 0,
            RIGHT: positionCounts.find(p => p.position === 'RIGHT')?._count.id || 0,
            ROOT: positionCounts.find(p => p.position === 'ROOT' || p.position === null)?._count.id || 0
        };

        // ===== RANK DISTRIBUTION =====
        const usersByRank = await prisma.user.groupBy({
            by: ['rank'],
            _count: { id: true }
        });

        // ===== KYC STATUS =====
        const kycCounts = await prisma.user.groupBy({
            by: ['kycStatus'],
            _count: { id: true }
        });
        const kycStats = {
            NOT_STARTED: kycCounts.find(k => k.kycStatus === 'NOT_STARTED')?._count.id || 0,
            IN_PROGRESS: kycCounts.find(k => k.kycStatus === 'IN_PROGRESS')?._count.id || 0,
            VERIFIED: kycCounts.find(k => k.kycStatus === 'VERIFIED')?._count.id || 0,
            FAILED: kycCounts.find(k => k.kycStatus === 'FAILED')?._count.id || 0
        };

        // ===== FINANCIAL METRICS =====
        // Bonus totals by type
        const bonusTotals = await prisma.transaction.groupBy({
            by: ['type'],
            _sum: { amount: true },
            _count: { id: true },
            where: { type: { in: ['DIRECT_BONUS', 'MATCHING_BONUS', 'LEADERSHIP_BONUS'] } }
        });

        // Total wallet balance across all users
        const totalWalletBalance = await prisma.wallet.aggregate({
            _sum: { balance: true }
        });

        // Withdrawal stats
        const withdrawalStats = await prisma.withdrawal.groupBy({
            by: ['status'],
            _sum: { amount: true },
            _count: { id: true }
        });

        // Today's bonuses
        const todayBonuses = await prisma.transaction.aggregate({
            _sum: { amount: true },
            where: {
                createdAt: { gte: startOfToday },
                type: { in: ['DIRECT_BONUS', 'MATCHING_BONUS', 'LEADERSHIP_BONUS'] }
            }
        });

        // This month's bonuses
        const monthBonuses = await prisma.transaction.aggregate({
            _sum: { amount: true },
            where: {
                createdAt: { gte: startOfMonth },
                type: { in: ['DIRECT_BONUS', 'MATCHING_BONUS', 'LEADERSHIP_BONUS'] }
            }
        });

        // ===== ORDER/PURCHASE METRICS =====
        // Count both Order records (from payment gateway) and PURCHASE transactions (direct API)
        const totalOrders = await prisma.order.count({ where: { status: 'PAID' } });
        const totalPurchases = await prisma.transaction.count({ where: { type: 'PURCHASE' } });
        const totalOrdersAndPurchases = totalOrders + totalPurchases;

        const todayOrders = await prisma.order.count({
            where: { status: 'PAID', createdAt: { gte: startOfToday } }
        });
        const todayPurchases = await prisma.transaction.count({
            where: { type: 'PURCHASE', createdAt: { gte: startOfToday } }
        });
        const todayOrdersAndPurchases = todayOrders + todayPurchases;

        const monthOrders = await prisma.order.count({
            where: { status: 'PAID', createdAt: { gte: startOfMonth } }
        });
        const monthPurchases = await prisma.transaction.count({
            where: { type: 'PURCHASE', createdAt: { gte: startOfMonth } }
        });
        const monthOrdersAndPurchases = monthOrders + monthPurchases;

        // Calculate revenue from orders and purchase transactions
        const orderRevenue = await prisma.order.aggregate({
            _sum: { totalAmount: true },
            where: { status: 'PAID' }
        });
        const purchaseRevenue = await prisma.transaction.aggregate({
            _sum: { amount: true },
            where: { type: 'PURCHASE' }
        });
        const totalRevenue = (orderRevenue._sum.totalAmount || 0) + (purchaseRevenue._sum.amount || 0);

        const monthOrderRevenue = await prisma.order.aggregate({
            _sum: { totalAmount: true },
            where: { status: 'PAID', createdAt: { gte: startOfMonth } }
        });
        const monthPurchaseRevenue = await prisma.transaction.aggregate({
            _sum: { amount: true },
            where: { type: 'PURCHASE', createdAt: { gte: startOfMonth } }
        });
        const monthRevenue = (monthOrderRevenue._sum.totalAmount || 0) + (monthPurchaseRevenue._sum.amount || 0);

        // ===== PRODUCT METRICS =====
        const totalProducts = await prisma.product.count();
        const lowStockProducts = await prisma.product.count({ where: { stock: { lt: 10 } } });

        // Daily new users (last 30 days) with bonus stats
        const dailyUsers = await prisma.$queryRaw`
            SELECT DATE("createdAt") as date, COUNT(*) as count
            FROM "User"
            WHERE "createdAt" >= ${thirtyDaysAgo}
            GROUP BY DATE("createdAt")
            ORDER BY date ASC
        `;

        // Get daily bonus stats
        const dailyBonusStats = await prisma.$queryRaw`
            SELECT DATE("createdAt") as date, type, SUM(amount) as total
            FROM "Transaction"
            WHERE "createdAt" >= ${thirtyDaysAgo}
            AND type IN ('DIRECT_BONUS', 'MATCHING_BONUS', 'LEADERSHIP_BONUS')
            GROUP BY DATE("createdAt"), type
            ORDER BY date ASC
        `;

        // Get daily orders
        const dailyOrders = await prisma.$queryRaw`
            SELECT DATE("createdAt") as date, COUNT(*) as count
            FROM "Order"
            WHERE "createdAt" >= ${thirtyDaysAgo} AND status = 'PAID'
            GROUP BY DATE("createdAt")
            ORDER BY date ASC
        `;

        // Monthly user signups (last 12 months) with bonus stats
        const monthlyUsers = await prisma.$queryRaw`
            SELECT TO_CHAR("createdAt", 'YYYY-MM') as month, COUNT(*) as count
            FROM "User"
            WHERE "createdAt" >= ${twelveMonthsAgo}
            GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
            ORDER BY month ASC
        `;

        // Get monthly bonus stats
        const monthlyBonusStats = await prisma.$queryRaw`
            SELECT TO_CHAR("createdAt", 'YYYY-MM') as month, type, SUM(amount) as total
            FROM "Transaction"
            WHERE "createdAt" >= ${twelveMonthsAgo}
            AND type IN ('DIRECT_BONUS', 'MATCHING_BONUS', 'LEADERSHIP_BONUS')
            GROUP BY TO_CHAR("createdAt", 'YYYY-MM'), type
            ORDER BY month ASC
        `;

        // Get monthly orders
        const monthlyOrderStats = await prisma.$queryRaw`
            SELECT TO_CHAR("createdAt", 'YYYY-MM') as month, COUNT(*) as count
            FROM "Order"
            WHERE "createdAt" >= ${twelveMonthsAgo} AND status = 'PAID'
            GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
            ORDER BY month ASC
        `;

        // Monthly Bonus Trends (last 6 months)
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

        // Monthly Withdrawals
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

        // Daily revenue (last 30 days)
        const dailyRevenue = await prisma.$queryRaw`
            SELECT DATE("createdAt") as date, SUM("totalAmount") as total
            FROM "Order"
            WHERE "createdAt" >= ${thirtyDaysAgo}
            AND status = 'PAID'
            GROUP BY DATE("createdAt")
            ORDER BY date ASC
        `;

        res.json({
            ok: true,
            stats: {
                // User Overview
                users: {
                    total: totalUsers,
                    today: todayUsers,
                    thisWeek: weekUsers,
                    thisMonth: monthUsers,
                    active: activeUsers,
                    pending: pendingUsers
                },
                // Position Distribution
                positions: usersByPosition,
                // Rank Distribution
                ranks: usersByRank.map(r => ({ rank: r.rank, count: r._count.id })),
                // KYC Status
                kyc: kycStats,
                // Financial Overview
                financial: {
                    totalWalletBalance: totalWalletBalance._sum.balance || 0,
                    todayBonuses: todayBonuses._sum.amount || 0,
                    monthBonuses: monthBonuses._sum.amount || 0,
                    bonusTotals: bonusTotals.map(b => ({
                        type: b.type,
                        total: b._sum.amount || 0,
                        count: b._count.id
                    })),
                    withdrawals: withdrawalStats.map(w => ({
                        status: w.status,
                        total: w._sum.amount || 0,
                        count: w._count.id
                    }))
                },
                // Orders/Revenue
                orders: {
                    total: totalOrdersAndPurchases,
                    today: todayOrdersAndPurchases,
                    thisMonth: monthOrdersAndPurchases,
                    totalRevenue: totalRevenue,
                    monthRevenue: monthRevenue
                },
                // Products
                products: {
                    total: totalProducts,
                    lowStock: lowStockProducts
                },
                // Time Series
                trends: {
                    dailyUsers: dailyUsers.map(d => {
                        const dateStr = d.date?.toISOString?.().split('T')[0] || d.date;
                        const bonuses = dailyBonusStats.filter(b => (b.date?.toISOString?.().split('T')[0] || b.date) === dateStr);
                        const orderData = dailyOrders.find(o => (o.date?.toISOString?.().split('T')[0] || o.date) === dateStr);
                        return {
                            date: dateStr,
                            count: Number(d.count),
                            directBonus: Number(bonuses.find(b => b.type === 'DIRECT_BONUS')?.total || 0),
                            matchingBonus: Number(bonuses.find(b => b.type === 'MATCHING_BONUS')?.total || 0),
                            leadershipBonus: Number(bonuses.find(b => b.type === 'LEADERSHIP_BONUS')?.total || 0),
                            orders: Number(orderData?.count || 0)
                        };
                    }),
                    monthlyUsers: monthlyUsers.map(m => {
                        const bonuses = monthlyBonusStats.filter(b => b.month === m.month);
                        const orderData = monthlyOrderStats.find(o => o.month === m.month);
                        return {
                            month: m.month,
                            count: Number(m.count),
                            directBonus: Number(bonuses.find(b => b.type === 'DIRECT_BONUS')?.total || 0),
                            matchingBonus: Number(bonuses.find(b => b.type === 'MATCHING_BONUS')?.total || 0),
                            leadershipBonus: Number(bonuses.find(b => b.type === 'LEADERSHIP_BONUS')?.total || 0),
                            orders: Number(orderData?.count || 0)
                        };
                    }),
                    monthlyBonuses: monthlyBonuses.map(b => ({ month: b.month, type: b.type, total: Number(b.total) })),
                    monthlyWithdrawals: monthlyWithdrawals.map(w => ({ month: w.month, total: Number(w.total) })),
                    dailyRevenue: dailyRevenue.map(d => ({ date: d.date, total: Number(d.total) }))
                }
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
                name: true,
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
