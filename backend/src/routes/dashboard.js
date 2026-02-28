const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/dashboard/stats - Team Overview
router.get('/stats', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;

        // Get user with children (placement tree) and referrals (sponsor tree)
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                leftBV: true,
                rightBV: true,
                leftCarryBV: true,
                rightCarryBV: true,
                leftMemberCount: true,
                rightMemberCount: true,
                leftCarryCount: true,
                rightCarryCount: true,
                rank: true,
                totalPairs: true,
                // Placement tree children (for total team)
                children: {
                    select: { id: true, position: true }
                },
                // Direct referrals (sponsor relationship)
                referrals: {
                    select: { id: true, position: true, isBlocked: true }
                }
            }
        });

        const BV_PER_MEMBER = parseInt(process.env.PAIR_UNIT_BV || '50', 10);

        // Calculate paid BV from actual consumed members stored in pairPayoutRecords
        const payoutAggregates = await prisma.pairPayoutRecord.aggregate({
            where: { userId },
            _sum: { leftConsumed: true, rightConsumed: true }
        });
        const paidLeftMembers = payoutAggregates._sum.leftConsumed || 0;
        const paidRightMembers = payoutAggregates._sum.rightConsumed || 0;
        const leftPaidBV = paidLeftMembers * BV_PER_MEMBER;
        const rightPaidBV = paidRightMembers * BV_PER_MEMBER;

        // === TREE TRAVERSAL (Find exact physical member count) ===
        // We decouple dashboard counts from matching queue fields
        const allPlacement = await prisma.user.findMany({ select: { id: true, parentId: true, position: true } });
        const childrenMap = new Map();
        for (const u of allPlacement) {
            if (u.parentId) {
                if (!childrenMap.has(u.parentId)) childrenMap.set(u.parentId, []);
                childrenMap.get(u.parentId).push(u);
            }
        }
        function countDescendants(nodeId) {
            let count = 0;
            const children = childrenMap.get(nodeId) || [];
            count += children.length;
            for (const child of children) {
                count += countDescendants(child.id);
            }
            return count;
        }
        const immediateChildren = childrenMap.get(userId) || [];
        const leftChild = immediateChildren.find(c => c.position === 'LEFT');
        const rightChild = immediateChildren.find(c => c.position === 'RIGHT');

        const leftMembers = leftChild ? 1 + countDescendants(leftChild.id) : 0;
        const rightMembers = rightChild ? 1 + countDescendants(rightChild.id) : 0;

        // Get the actual product BV from the database (used for paid BV calculation)
        const mainProduct = await prisma.product.findFirst({ select: { bv: true } });
        const PRODUCT_BV = mainProduct?.bv || BV_PER_MEMBER;

        // Total BV: use the already-accumulated leftBV/rightBV from the user record
        // These fields are updated by purchaseService with actual product.bv on every purchase
        const leftBV = user.leftBV || 0;
        const rightBV = user.rightBV || 0;
        const leftPaidBVActual = paidLeftMembers * PRODUCT_BV;
        const rightPaidBVActual = paidRightMembers * PRODUCT_BV;

        // Calculate direct referrals by position
        const directLeft = user.referrals.filter(r => r.position === 'LEFT').length;
        const directRight = user.referrals.filter(r => r.position === 'RIGHT').length;
        const directTotal = user.referrals.length;

        // Active counts (non-blocked) for direct referrals
        const directActiveLeft = user.referrals.filter(r => r.position === 'LEFT' && !r.isBlocked).length;
        const directActiveRight = user.referrals.filter(r => r.position === 'RIGHT' && !r.isBlocked).length;
        const directActiveTotal = user.referrals.filter(r => !r.isBlocked).length;

        res.json({
            ok: true,
            stats: {
                totalTeam: {
                    leftMembers,
                    rightMembers,
                    leftBV,
                    rightBV,
                    activeLeft: leftMembers,
                    activeRight: rightMembers,
                    leftPaidBV,
                    rightPaidBV,
                    leftCarryMembers: user.leftCarryCount || 0,
                    rightCarryMembers: user.rightCarryCount || 0
                },
                user: {
                    rank: user.rank,
                    totalPairs: user.totalPairs
                },
                directTeam: {
                    total: directTotal,
                    left: directLeft,
                    right: directRight,
                    activeTotal: directActiveTotal,
                    activeLeft: directActiveLeft,
                    activeRight: directActiveRight
                },
                carryForward: {
                    left: Math.max(0, leftBV - leftPaidBVActual),
                    right: Math.max(0, rightBV - rightPaidBVActual)
                }
            }
        });
    } catch (err) {
        console.error('Dashboard Stats Error:', err);
        res.status(500).json({ ok: false, error: 'Failed to fetch dashboard stats' });
    }
});

// GET /api/dashboard/incentives - Payout Info
router.get('/incentives', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;

        // Aggregates
        const aggregations = await prisma.transaction.groupBy({
            by: ['type'],
            where: { userId },
            _sum: { amount: true }
        });

        let directBonus = 0;
        let matchingBonus = 0;
        let leadershipBonus = 0;
        let totalPaid = 0;

        aggregations.forEach(agg => {
            if (agg.type === 'DIRECT_BONUS') directBonus = (agg._sum.amount || 0);
            if (agg.type === 'MATCHING_BONUS') matchingBonus = (agg._sum.amount || 0);
            if (agg.type === 'LEADERSHIP_BONUS') leadershipBonus = (agg._sum.amount || 0);
        });
        totalPaid = directBonus + matchingBonus + leadershipBonus;

        // Get today's counters
        const nowStr = new Date().toLocaleString("en-US", { timeZone: 'Asia/Kolkata' });
        const nowIst = new Date(nowStr);
        const todayStart = new Date(nowIst.getFullYear(), nowIst.getMonth(), nowIst.getDate());
        const todayEnd = new Date(nowIst.getFullYear(), nowIst.getMonth(), nowIst.getDate() + 1);

        const [todayLeadership, todayMatching] = await Promise.all([
            prisma.dailyLeadershipCounter.findFirst({
                where: { userId, date: { gte: todayStart, lt: todayEnd } }
            }),
            prisma.dailyPairCounter.findFirst({
                where: { userId, date: { gte: todayStart, lt: todayEnd } }
            })
        ]);

        // Calculate today's matching bonus from pairs
        const bonusPerMatch = parseInt(process.env.MATCHING_BONUS_PER_MATCH || '700', 10);
        const todayMatchingBonus = (todayMatching?.pairs || 0) * bonusPerMatch;
        const matchingPairCap = parseInt(process.env.DAILY_PAIR_CAP || '10', 10);
        const matchingBonusCap = matchingPairCap * bonusPerMatch;

        // History with Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const whereHistory = {
            userId,
            type: { in: ['DIRECT_BONUS', 'MATCHING_BONUS', 'LEADERSHIP_BONUS'] }
        };

        const totalHistory = await prisma.transaction.count({ where: whereHistory });
        const history = await prisma.transaction.findMany({
            where: whereHistory,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit
        });

        res.json({
            ok: true,
            data: {
                summary: {
                    totalPaid,
                    directBonus,
                    matchingBonus,
                    leadershipBonus,
                    todayLeadershipBonus: todayLeadership?.amount || 0,
                    leadershipDailyCap: parseInt(process.env.DAILY_LEADERSHIP_BONUS_CAP || '5000', 10),
                    todayMatchingBonus,
                    matchingDailyCap: matchingBonusCap,
                    todayPairs: todayMatching?.pairs || 0,
                    dailyPairCap: matchingPairCap
                },
                history,
                pagination: {
                    page,
                    limit,
                    total: totalHistory,
                    totalPages: Math.ceil(totalHistory / limit),
                    hasNext: page < Math.ceil(totalHistory / limit),
                    hasPrev: page > 1
                }
            }
        });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

// GET /api/dashboard/team - Team Listing (Directs)
router.get('/team', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { search, from, to, team } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Preload minimal tree topology for fast memory counting
        const allUsers = await prisma.user.findMany({ select: { id: true, parentId: true, position: true } });
        const userMap = new Map();
        for (const u of allUsers) {
            if (u.parentId) {
                let childrenList = userMap.get(u.parentId);
                if (!childrenList) {
                    childrenList = [];
                    userMap.set(u.parentId, childrenList);
                }
                childrenList.push(u);
            }
        }

        // Helper to get all descendants in the placement tree using memory map
        function getAllDescendantIdsMemory(parentId) {
            const children = userMap.get(parentId) || [];
            let ids = [];
            for (const child of children) {
                ids.push({ id: child.id, position: child.position });
                const descendants = getAllDescendantIdsMemory(child.id);
                ids = ids.concat(descendants);
            }
            return ids;
        }

        // Get immediate children to determine left/right subtree roots
        const immediateChildren = userMap.get(userId) || [];

        // Collect all descendant IDs with their position relative to root
        let allDescendants = [];
        for (const child of immediateChildren) {
            allDescendants.push({ id: child.id, rootPosition: child.position });
            const descendants = getAllDescendantIdsMemory(child.id);
            allDescendants = allDescendants.concat(descendants.map(d => ({ id: d.id, rootPosition: child.position })));
        }

        // Build where clause
        let targetIds = allDescendants.map(d => d.id);

        // Apply team filter (LEFT/RIGHT)
        if (team && (team === 'LEFT' || team === 'RIGHT')) {
            targetIds = allDescendants.filter(d => d.rootPosition === team).map(d => d.id);
        }

        const where = { id: { in: targetIds } };

        if (search) {
            where.AND = [
                { id: { in: targetIds } },
                {
                    OR: [
                        { username: { contains: search, mode: 'insensitive' } },
                        { email: { contains: search, mode: 'insensitive' } }
                    ]
                }
            ];
            delete where.id;
        }

        if (from && to) {
            where.createdAt = {
                gte: new Date(from),
                lte: new Date(to)
            };
        }

        // Get total count
        const total = await prisma.user.count({ where });
        const totalPages = Math.ceil(total / limit);

        const members = await prisma.user.findMany({
            where,
            select: {
                id: true,
                username: true,
                email: true,
                createdAt: true,
                isBlocked: true,
                hasPurchased: true,
                leftBV: true,
                rightBV: true,
                sponsor: { select: { username: true } },
                position: true
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit
        });

        // Map with team position relative to logged-in user
        const positionMap = new Map(allDescendants.map(d => [d.id, d.rootPosition]));
        const mappedMembers = members.map(m => ({
            ...m,
            status: m.isBlocked ? 'Blocked' : (m.hasPurchased ? 'Active' : 'Inactive'),
            introducer: m.sponsor?.username || 'N/A',
            team: positionMap.get(m.id) || m.position || 'N/A'
        }));

        res.json({
            ok: true,
            members: mappedMembers,
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
        res.status(500).json({ ok: false, error: err.message });
    }
});


// GET /api/dashboard/matching - Matching Report
router.get('/matching', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;

        // Get user's current BV and member counts
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                leftBV: true,
                rightBV: true,
                leftCarryBV: true,
                rightCarryBV: true,
                leftMemberCount: true,
                rightMemberCount: true,
                leftCarryCount: true,
                rightCarryCount: true
            }
        });

        // IST boundaries for "today"
        const nowStr = new Date().toLocaleString("en-US", { timeZone: 'Asia/Kolkata' });
        const nowIst = new Date(nowStr);
        const todayStart = new Date(nowIst.getFullYear(), nowIst.getMonth(), nowIst.getDate());
        const todayEnd = new Date(nowIst.getFullYear(), nowIst.getMonth(), nowIst.getDate() + 1);

        const todayPayout = await prisma.pairPayoutRecord.findFirst({
            where: { userId, date: { gte: todayStart, lt: todayEnd } },
            orderBy: { createdAt: 'desc' }
        });

        // Get ALL-TIME total paid out
        const totalPayoutAgg = await prisma.pairPayoutRecord.aggregate({
            where: { userId },
            _sum: { amount: true, leftConsumed: true, rightConsumed: true }
        });

        // Get TODAY's paid out (IST scoped)
        const todayPayoutAgg = await prisma.pairPayoutRecord.aggregate({
            where: { userId, date: { gte: todayStart, lt: todayEnd } },
            _sum: { amount: true, leftConsumed: true, rightConsumed: true }
        });

        // Payout History - Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const whereHistory = { userId, type: 'MATCHING_BONUS' };
        const totalHistory = await prisma.transaction.count({ where: whereHistory });

        const history = await prisma.transaction.findMany({
            where: whereHistory,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit
        });

        const BV_PER_MEMBER = parseInt(process.env.PAIR_UNIT_BV || '50', 10);

        // === ALL-TIME MEMBER CALCULATIONS ===
        const paidLeftMembers = totalPayoutAgg._sum.leftConsumed || 0;
        const paidRightMembers = totalPayoutAgg._sum.rightConsumed || 0;


        const allPlacement = await prisma.user.findMany({
            select: { id: true, parentId: true, position: true }
        });
        const childrenMap = new Map();
        for (const u of allPlacement) {
            if (u.parentId) {
                if (!childrenMap.has(u.parentId)) childrenMap.set(u.parentId, []);
                childrenMap.get(u.parentId).push(u);
            }
        }
        function getAllDescendantIds(nodeId) {
            const children = childrenMap.get(nodeId) || [];
            let ids = children.map(c => c.id);
            for (const child of children) {
                ids = ids.concat(getAllDescendantIds(child.id));
            }
            return ids;
        }
        const immediateChildren = childrenMap.get(userId) || [];
        const leftChild = immediateChildren.find(c => c.position === 'LEFT');
        const rightChild = immediateChildren.find(c => c.position === 'RIGHT');
        const leftDescendantIds = leftChild ? [leftChild.id, ...getAllDescendantIds(leftChild.id)] : [];
        const rightDescendantIds = rightChild ? [rightChild.id, ...getAllDescendantIds(rightChild.id)] : [];

        // Total accumulated members = Physical count of all descendants
        // This decouples the dashboard display from the matching queue fields
        const totalLeftMembers = leftDescendantIds.length;
        const totalRightMembers = rightDescendantIds.length;

        // === TOTAL BV: use user.leftBV/rightBV directly ===
        // These are already accumulated with actual product.bv on every purchase in purchaseService
        const mainProduct = await prisma.product.findFirst({ select: { bv: true } });
        const PRODUCT_BV = mainProduct?.bv || BV_PER_MEMBER;

        const totalLeftBV = user.leftBV || 0;
        const totalRightBV = user.rightBV || 0;
        const totalPaidLeftBV = paidLeftMembers * PRODUCT_BV;
        const totalPaidRightBV = paidRightMembers * PRODUCT_BV;

        // === CARRY FORWARD = Total BV - Total Paid BV (all-time) ===
        const carryLeftBV = Math.max(0, totalLeftBV - totalPaidLeftBV);
        const carryRightBV = Math.max(0, totalRightBV - totalPaidRightBV);
        const carryLeftMembers = Math.max(0, totalLeftMembers - paidLeftMembers);
        const carryRightMembers = Math.max(0, totalRightMembers - paidRightMembers);

        // === TODAY'S BV (IST scoped) ===
        const todayPaidLeftMembers = todayPayoutAgg._sum.leftConsumed || 0;
        const todayPaidRightMembers = todayPayoutAgg._sum.rightConsumed || 0;
        const todayPaidLeftBV = todayPaidLeftMembers * PRODUCT_BV;
        const todayPaidRightBV = todayPaidRightMembers * PRODUCT_BV;

        // Today's new members per leg: users whose FIRST purchase (PAID order) was today (IST)
        const newPurchasersToday = await prisma.$queryRaw`
            SELECT "userId" FROM "Order"
            WHERE status = 'PAID'
            GROUP BY "userId"
            HAVING MIN("createdAt") >= ${todayStart} AND MIN("createdAt") < ${todayEnd}
        `;
        const newPurchaserIds = new Set(newPurchasersToday.map(r => r.userId));

        const todayNewLeftMembers = leftDescendantIds.filter(id => newPurchaserIds.has(id)).length;
        const todayNewRightMembers = rightDescendantIds.filter(id => newPurchaserIds.has(id)).length;

        // Today's unpaid = today's new members - today's consumed members
        const todayUnpaidLeftMembers = Math.max(0, todayNewLeftMembers - todayPaidLeftMembers);
        const todayUnpaidRightMembers = Math.max(0, todayNewRightMembers - todayPaidRightMembers);
        const todayUnpaidLeftBV = todayUnpaidLeftMembers * PRODUCT_BV;
        const todayUnpaidRightBV = todayUnpaidRightMembers * PRODUCT_BV;

        res.json({
            ok: true,
            current: {
                left: {
                    totalBV: totalLeftBV,
                    paidBV: todayPaidLeftBV,
                    unpaidBV: todayUnpaidLeftBV,
                    carryForward: carryLeftBV,
                    totalMembers: totalLeftMembers, // Physical count
                    totalPurchasedMembers: Math.floor(totalLeftBV / PRODUCT_BV), // Members who generated the BV
                    paidMembers: todayPaidLeftMembers,
                    unpaidMembers: todayUnpaidLeftMembers,
                    carryMembers: carryLeftMembers,
                    carryPurchasedMembers: Math.floor(carryLeftBV / PRODUCT_BV)
                },
                right: {
                    totalBV: totalRightBV,
                    paidBV: todayPaidRightBV,
                    unpaidBV: todayUnpaidRightBV,
                    carryForward: carryRightBV,
                    totalMembers: totalRightMembers, // Physical count
                    totalPurchasedMembers: Math.floor(totalRightBV / PRODUCT_BV), // Members who generated the BV
                    paidMembers: todayPaidRightMembers,
                    unpaidMembers: todayUnpaidRightMembers,
                    carryMembers: carryRightMembers,
                    carryPurchasedMembers: Math.floor(carryRightBV / PRODUCT_BV)
                }
            },
            todayPayout: todayPayout ? {
                pairs: todayPayout.pairs,
                amount: todayPayout.amount,
                matchType: todayPayout.matchType,
                membersConsumed: todayPayout.membersConsumed
            } : null,
            totalStats: {
                totalPayoutAmount: totalPayoutAgg._sum.amount || 0,
                totalPaidLeftBV: totalPaidLeftBV,
                totalPaidRightBV: totalPaidRightBV
            },
            history,
            pagination: {
                page,
                limit,
                total: totalHistory,
                totalPages: Math.ceil(totalHistory / limit),
                hasNext: page < Math.ceil(totalHistory / limit),
                hasPrev: page > 1
            }
        });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

// GET /api/dashboard/transactions - All Transactions with Pagination
router.get('/transactions', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const type = req.query.type; // DIRECT_BONUS, MATCHING_BONUS, PURCHASE, etc.
        const from = req.query.from;
        const to = req.query.to;

        const where = { userId };

        // Filter by type
        if (type && type !== 'all') {
            where.type = type;
        }

        // Filter by date range
        if (from && to) {
            where.createdAt = {
                gte: new Date(from),
                lte: new Date(to)
            };
        }

        // Get total count
        const total = await prisma.transaction.count({ where });
        const totalPages = Math.ceil(total / limit);

        // Get paginated transactions
        const transactions = await prisma.transaction.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit
        });

        // Get summary stats
        const stats = await prisma.transaction.groupBy({
            by: ['type'],
            where: { userId },
            _sum: { amount: true },
            _count: true
        });

        res.json({
            ok: true,
            transactions,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            },
            stats: stats.map(s => ({
                type: s.type,
                total: s._sum.amount || 0,
                count: s._count
            }))
        });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

module.exports = router;

