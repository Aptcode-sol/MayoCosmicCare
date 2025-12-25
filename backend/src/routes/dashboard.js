const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/dashboard/stats - Team Overview
router.get('/stats', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;

        // Helper function to count all descendants in a subtree
        async function countDescendants(parentId) {
            if (!parentId) return 0;
            const children = await prisma.user.findMany({
                where: { parentId },
                select: { id: true }
            });
            let count = children.length;
            for (const child of children) {
                count += await countDescendants(child.id);
            }
            return count;
        }

        // Get user with children (placement tree) and referrals (sponsor tree)
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                leftBV: true,
                rightBV: true,
                leftCarryBV: true,
                rightCarryBV: true,
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

        // Calculate total team (placement tree)
        const leftChild = user.children.find(c => c.position === 'LEFT');
        const rightChild = user.children.find(c => c.position === 'RIGHT');
        const leftMembers = leftChild ? 1 + await countDescendants(leftChild.id) : 0;
        const rightMembers = rightChild ? 1 + await countDescendants(rightChild.id) : 0;

        // Calculate direct referrals by position
        const directLeft = user.referrals.filter(r => r.position === 'LEFT').length;
        const directRight = user.referrals.filter(r => r.position === 'RIGHT').length;
        const directTotal = user.referrals.length;

        // Active counts (non-blocked) for direct referrals
        const directActiveLeft = user.referrals.filter(r => r.position === 'LEFT' && !r.isBlocked).length;
        const directActiveRight = user.referrals.filter(r => r.position === 'RIGHT' && !r.isBlocked).length;
        const directActiveTotal = user.referrals.filter(r => !r.isBlocked).length;

        // Calculate paid BV from actual consumed members stored in pairPayoutRecords
        const payoutAggregates = await prisma.pairPayoutRecord.aggregate({
            where: { userId },
            _sum: { leftConsumed: true, rightConsumed: true }
        });
        const avgBVPerMember = 7000; // Standard mattress BV
        const leftPaidBV = (payoutAggregates._sum.leftConsumed || 0) * avgBVPerMember;
        const rightPaidBV = (payoutAggregates._sum.rightConsumed || 0) * avgBVPerMember;

        res.json({
            ok: true,
            stats: {
                totalTeam: {
                    leftMembers,
                    rightMembers,
                    leftBV: user.leftBV,
                    rightBV: user.rightBV,
                    activeLeft: leftMembers,
                    activeRight: rightMembers,
                    leftPaidBV,
                    rightPaidBV
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
                    left: user.leftCarryBV,
                    right: user.rightCarryBV
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
        let totalPaid = 0;

        aggregations.forEach(agg => {
            if (agg.type === 'DIRECT_BONUS') directBonus = (agg._sum.amount || 0);
            if (agg.type === 'MATCHING_BONUS') matchingBonus = (agg._sum.amount || 0);
        });
        totalPaid = directBonus + matchingBonus;

        // History
        const history = await prisma.transaction.findMany({
            where: {
                userId,
                type: { in: ['DIRECT_BONUS', 'MATCHING_BONUS'] }
            },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        res.json({
            ok: true,
            data: {
                summary: { totalPaid, directBonus, matchingBonus },
                history
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

        // Helper to get all descendants in the placement tree
        async function getAllDescendantIds(parentId) {
            const children = await prisma.user.findMany({
                where: { parentId },
                select: { id: true, position: true }
            });
            let ids = [];
            for (const child of children) {
                ids.push({ id: child.id, position: child.position });
                const descendants = await getAllDescendantIds(child.id);
                ids = ids.concat(descendants);
            }
            return ids;
        }

        // Get immediate children to determine left/right subtree roots
        const immediateChildren = await prisma.user.findMany({
            where: { parentId: userId },
            select: { id: true, position: true }
        });

        // Collect all descendant IDs with their position relative to root
        let allDescendants = [];
        for (const child of immediateChildren) {
            allDescendants.push({ id: child.id, rootPosition: child.position });
            const descendants = await getAllDescendantIds(child.id);
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
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

        const todayPayout = await prisma.pairPayoutRecord.findFirst({
            where: { userId, date: { gte: todayStart, lt: todayEnd } },
            orderBy: { createdAt: 'desc' }
        });

        // Get total paid out
        const totalPayoutAgg = await prisma.pairPayoutRecord.aggregate({
            where: { userId },
            _sum: { amount: true, leftConsumed: true, rightConsumed: true }
        });

        // Payout History - last 20 matching bonus transactions
        const history = await prisma.transaction.findMany({
            where: { userId, type: 'MATCHING_BONUS' },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        // Calculate clear metrics:
        // - Total BV: All accumulated BV (from all purchases in downline)
        // - Paid BV: BV that was matched and paid out  
        // - Unpaid BV: Remaining BV waiting for matching (Total - Paid)
        // - Carry Forward: Members that couldn't be matched (waiting for opposite side)

        const BV_PER_MEMBER = parseInt(process.env.PRODUCT_BV || '7000', 10);

        // Total paid BV from all payouts
        const paidLeftBV = (totalPayoutAgg._sum.leftConsumed || 0) * BV_PER_MEMBER;
        const paidRightBV = (totalPayoutAgg._sum.rightConsumed || 0) * BV_PER_MEMBER;

        // Total accumulated BV
        const totalLeftBV = user.leftBV || 0;
        const totalRightBV = user.rightBV || 0;

        // Unpaid BV = Total accumulated minus what was paid
        const unpaidLeftBV = Math.max(0, totalLeftBV - paidLeftBV);
        const unpaidRightBV = Math.max(0, totalRightBV - paidRightBV);

        // Carry Forward = members waiting for opposite side to match
        const carryLeftBV = (user.leftCarryCount || 0) * BV_PER_MEMBER;
        const carryRightBV = (user.rightCarryCount || 0) * BV_PER_MEMBER;

        res.json({
            ok: true,
            current: {
                left: {
                    totalBV: totalLeftBV,
                    paidBV: paidLeftBV,
                    unpaidBV: unpaidLeftBV,
                    carryForward: carryLeftBV
                },
                right: {
                    totalBV: totalRightBV,
                    paidBV: paidRightBV,
                    unpaidBV: unpaidRightBV,
                    carryForward: carryRightBV
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
            history
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

