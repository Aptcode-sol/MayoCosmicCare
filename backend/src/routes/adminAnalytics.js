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
        const [
            totalUsers,
            todayUsers,
            weekUsers,
            monthUsers,
            activeUsers,
            pendingUsers,
            totalOrders,
            totalPurchases,
            totalProducts,
            lowStockProducts
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { createdAt: { gte: startOfToday } } }),
            prisma.user.count({ where: { createdAt: { gte: startOfWeek } } }),
            prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
            prisma.user.count({ where: { hasPurchased: true } }),
            prisma.user.count({ where: { hasPurchased: false } }),
            prisma.order.count({ where: { status: 'PAID' } }),
            prisma.order.count({ where: { status: 'PAID' } }), // Only count successful purchases
            prisma.product.count(),
            prisma.product.count({ where: { stock: { lt: 10 } } })
        ]);


        // totalUsers fetched in Promise.all
        // todayUsers fetched in Promise.all
        // weekUsers fetched in Promise.all
        // monthUsers fetched in Promise.all

        // Active users (users with purchases)
        // activeUsers fetched in Promise.all
        // pendingUsers fetched in Promise.all

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
        // Only count successful (PAID) orders for all metrics
        const totalOrdersAndPurchases = totalOrders; // Only successful orders

        const todayOrders = await prisma.order.count({
            where: { status: 'PAID', createdAt: { gte: startOfToday } }
        });
        const todayOrdersAndPurchases = todayOrders; // Only successful orders today

        const monthOrders = await prisma.order.count({
            where: { status: 'PAID', createdAt: { gte: startOfMonth } }
        });
        const monthOrdersAndPurchases = monthOrders; // Only successful orders this month

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
        // totalProducts fetched in Promise.all
        // lowStockProducts fetched in Promise.all

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

        // Get daily purchases (orders with status PAID)
        const dailyPurchases = await prisma.$queryRaw`
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

        // Get monthly purchases
        const monthlyPurchases = await prisma.$queryRaw`
            SELECT TO_CHAR("createdAt", 'YYYY-MM') as month, COUNT(*) as count
            FROM "Transaction"
            WHERE "createdAt" >= ${twelveMonthsAgo} AND type = 'PURCHASE'
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

        // Daily purchase revenue (last 30 days)
        const dailyPurchaseRevenue = await prisma.$queryRaw`
            SELECT DATE("createdAt") as date, SUM(amount) as total
            FROM "Transaction"
            WHERE "createdAt" >= ${thirtyDaysAgo} AND type = 'PURCHASE'
            GROUP BY DATE("createdAt")
            ORDER BY date ASC
        `;

        // Dev-only debug: log key analytics arrays and computed totals to help diagnose missing time-series
        if (process.env.NODE_ENV !== 'production') {
            try {
                // eslint-disable-next-line no-console
                /* console.info('[ADMIN_ANALYTICS_DEBUG]', {
                   totalOrdersAndPurchases,
                   todayOrdersAndPurchases,
                   monthOrdersAndPurchases,
                   totalRevenue,
                   monthRevenue,
                   dailyUsersCount: (dailyUsers || []).length,
                   dailyRevenueCount: (dailyRevenue || []).length,
                   dailyOrdersCount: (dailyOrders || []).length,
                   dailyPurchasesCount: (dailyPurchases || []).length
               }); */
            } catch (e) {
                // ignore logging errors
            }
        }

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
                    dailyUsers: [...Array(30)].map((_, i) => {
                        const d = new Date();
                        d.setDate(d.getDate() - (29 - i));
                        const dateStr = d.toISOString().split('T')[0];

                        const getDateStr = (item) => {
                            if (!item?.date) return '';
                            return String(item.date instanceof Date ? item.date.toISOString() : item.date).split('T')[0];
                        };

                        const userEntry = dailyUsers.find(u => getDateStr(u) === dateStr);
                        const bonuses = dailyBonusStats.filter(b => getDateStr(b) === dateStr);
                        const orderData = dailyOrders.find(o => getDateStr(o) === dateStr);
                        // Only use orderData for successful orders
                        return {
                            date: dateStr,
                            count: Number(userEntry?.count || 0),
                            directBonus: Number(bonuses.find(b => b.type === 'DIRECT_BONUS')?.total || 0),
                            matchingBonus: Number(bonuses.find(b => b.type === 'MATCHING_BONUS')?.total || 0),
                            leadershipBonus: Number(bonuses.find(b => b.type === 'LEADERSHIP_BONUS')?.total || 0),
                            orders: Number(orderData?.count || 0)
                        };
                    }),
                    monthlyUsers: monthlyUsers.map(m => {
                        const bonuses = monthlyBonusStats.filter(b => b.month === m.month);
                        const orderData = monthlyOrderStats.find(o => o.month === m.month);
                        const purchaseData = monthlyPurchases.find(p => p.month === m.month);
                        return {
                            month: m.month,
                            count: Number(m.count),
                            directBonus: Number(bonuses.find(b => b.type === 'DIRECT_BONUS')?.total || 0),
                            matchingBonus: Number(bonuses.find(b => b.type === 'MATCHING_BONUS')?.total || 0),
                            leadershipBonus: Number(bonuses.find(b => b.type === 'LEADERSHIP_BONUS')?.total || 0),
                            orders: Number(orderData?.count || 0) + Number(purchaseData?.count || 0)
                        };
                    }),
                    monthlyBonuses: monthlyBonuses.map(b => ({ month: b.month, type: b.type, total: Number(b.total) })),
                    monthlyWithdrawals: monthlyWithdrawals.map(w => ({ month: w.month, total: Number(w.total) })),
                    dailyRevenue: [...Array(30)].map((_, i) => {
                        const d = new Date();
                        d.setDate(d.getDate() - (29 - i));
                        const dateStr = d.toISOString().split('T')[0];

                        const getDateStr = (item) => String(item.date instanceof Date ? item.date.toISOString() : item.date).split('T')[0];

                        const orderRev = dailyRevenue.find(r => getDateStr(r) === dateStr);
                        const purchaseRev = dailyPurchaseRevenue.find(r => getDateStr(r) === dateStr);

                        return {
                            date: dateStr,
                            total: Number(orderRev?.total || 0) + Number(purchaseRev?.total || 0)
                        };
                    })
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
        // Get all users with their placement info and wallet balance
        const users = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                name: true,
                email: true,
                rank: true,
                hasPurchased: true,
                createdAt: true,
                sponsor: {
                    select: {
                        username: true
                    }
                },
                parentId: true,
                position: true,
                leftMemberCount: true,
                rightMemberCount: true,
                wallet: {
                    select: {
                        balance: true
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        });

        // Flatten wallet.balance to walletBalance for frontend compatibility
        const usersWithWallet = users.map(u => ({
            ...u,
            walletBalance: u.wallet?.balance || 0,
            wallet: undefined // Remove wallet object to avoid confusion
        }));

        res.json({ ok: true, users: usersWithWallet });
    } catch (err) {
        console.error('[ADMIN_NETWORK]', err);
        res.status(500).json({ ok: false, error: 'Failed to fetch network' });
    }
});

module.exports = router;
