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

        // Calculate total team (paid + unprocessed + carry)
        // Matching process resets member counts after consuming them
        const leftMembers = paidLeftMembers + (user.leftMemberCount || 0) + (user.leftCarryCount || 0);
        const rightMembers = paidRightMembers + (user.rightMemberCount || 0) + (user.rightCarryCount || 0);

        // Calculate BV from member counts for consistency
        const leftBV = leftMembers * BV_PER_MEMBER;
        const rightBV = rightMembers * BV_PER_MEMBER;

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
                    left: (user.leftCarryCount || 0) * BV_PER_MEMBER,
                    right: (user.rightCarryCount || 0) * BV_PER_MEMBER
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
            status: m.isBlocked ? 'Blocked' : 'Active',
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

        // Get today's payout record if any
        const nowStr = new Date().toLocaleString("en-US", { timeZone: 'Asia/Kolkata' });
        const nowIst = new Date(nowStr);
        const todayStart = new Date(nowIst.getFullYear(), nowIst.getMonth(), nowIst.getDate());
        const todayEnd = new Date(nowIst.getFullYear(), nowIst.getMonth(), nowIst.getDate() + 1);

        const todayPayout = await prisma.pairPayoutRecord.findFirst({
            where: { userId, date: { gte: todayStart, lt: todayEnd } },
            orderBy: { createdAt: 'desc' }
        });

        // Get total paid out
        const totalPayoutAgg = await prisma.pairPayoutRecord.aggregate({
            where: { userId },
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

        // Calculate clear metrics:
        // - Total BV: All accumulated BV (from all purchases in downline)
        // - Paid BV: BV that was matched and paid out  
        // - Unpaid BV: Remaining BV waiting for matching (Total - Paid)
        // - Carry Forward: Members that couldn't be matched (waiting for opposite side)

        const BV_PER_MEMBER = parseInt(process.env.PAIR_UNIT_BV || '50', 10);

        // === MEMBER CALCULATIONS ===
        // Paid members from payouts (already consumed and paid out)
        const paidLeftMembers = totalPayoutAgg._sum.leftConsumed || 0;
        const paidRightMembers = totalPayoutAgg._sum.rightConsumed || 0;

        // Total accumulated members = Paid + Unprocessed + Carry
        // (matching process resets member counts after consuming them)
        const totalLeftMembers = paidLeftMembers + (user.leftMemberCount || 0) + (user.leftCarryCount || 0);
        const totalRightMembers = paidRightMembers + (user.rightMemberCount || 0) + (user.rightCarryCount || 0);

        // Matchable pairs = min of both sides (how many could theoretically be matched)
        const matchablePairs = Math.min(totalLeftMembers, totalRightMembers);

        // Unpaid members = Total minus Paid
        const unpaidLeftMembers = Math.max(0, totalLeftMembers - paidLeftMembers);
        const unpaidRightMembers = Math.max(0, totalRightMembers - paidRightMembers);

        // Carry Forward = members that CANNOT be matched because opposite leg is too small
        // Left carry = excess left members (left > right)
        // Right carry = excess right members (right > left)
        const carryLeftMembers = Math.max(0, totalLeftMembers - totalRightMembers);
        const carryRightMembers = Math.max(0, totalRightMembers - totalLeftMembers);

        // === BV CALCULATIONS (based on member counts) ===
        // Total BV = all accumulated members * BV per member
        const totalLeftBV = totalLeftMembers * BV_PER_MEMBER;
        const totalRightBV = totalRightMembers * BV_PER_MEMBER;

        // Paid BV = paid members * BV per member
        const paidLeftBV = paidLeftMembers * BV_PER_MEMBER;
        const paidRightBV = paidRightMembers * BV_PER_MEMBER;

        // Unpaid BV = unpaid members * BV per member
        const unpaidLeftBV = unpaidLeftMembers * BV_PER_MEMBER;
        const unpaidRightBV = unpaidRightMembers * BV_PER_MEMBER;

        // Carry BV = carry members * BV per member
        const carryLeftBV = carryLeftMembers * BV_PER_MEMBER;
        const carryRightBV = carryRightMembers * BV_PER_MEMBER;

        res.json({
            ok: true,
            current: {
                left: {
                    totalBV: totalLeftBV,
                    paidBV: paidLeftBV,
                    unpaidBV: unpaidLeftBV,
                    carryForward: carryLeftBV,
                    totalMembers: totalLeftMembers,
                    paidMembers: paidLeftMembers,
                    unpaidMembers: unpaidLeftMembers,
                    carryMembers: carryLeftMembers
                },
                right: {
                    totalBV: totalRightBV,
                    paidBV: paidRightBV,
                    unpaidBV: unpaidRightBV,
                    carryForward: carryRightBV,
                    totalMembers: totalRightMembers,
                    paidMembers: paidRightMembers,
                    unpaidMembers: unpaidRightMembers,
                    carryMembers: carryRightMembers
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
                totalPaidLeftBV: paidLeftBV,
                totalPaidRightBV: paidRightBV
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

