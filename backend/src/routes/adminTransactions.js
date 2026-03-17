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

// GET /api/admin/transactions - List all transactions with pagination, search, and filters
router.get('/', authenticate, adminOnly, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 25;
        const skip = (page - 1) * limit;
        const search = req.query.search?.trim() || '';
        const typeFilter = req.query.type || '';
        const sortBy = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.sortOrder || 'desc';

        // 1. Fetch from Transaction table
        let transactionsData = [];
        if (!typeFilter || typeFilter !== 'WITHDRAW') {
            const txWhere = {};
            if (typeFilter && typeFilter !== 'all') {
                txWhere.type = typeFilter;
            }
            if (search) {
                txWhere.OR = [
                    { user: { username: { contains: search, mode: 'insensitive' } } },
                    { user: { name: { contains: search, mode: 'insensitive' } } },
                    { user: { email: { contains: search, mode: 'insensitive' } } },
                    { user: { phone: { contains: search, mode: 'insensitive' } } },
                    { detail: { contains: search, mode: 'insensitive' } },
                    { id: { contains: search, mode: 'insensitive' } }
                ];
            }
            transactionsData = await prisma.transaction.findMany({
                where: txWhere,
                include: {
                    user: {
                        select: { id: true, username: true, name: true, email: true, phone: true }
                    }
                }
            });
        }

        // 2. Fetch from Withdrawal table
        let withdrawalsData = [];
        if (!typeFilter || typeFilter === 'all' || typeFilter === 'WITHDRAW') {
            const wWhere = { status: { in: ['APPROVED', 'COMPLETED'] } };
            if (search) {
                wWhere.OR = [
                    { user: { username: { contains: search, mode: 'insensitive' } } },
                    { user: { name: { contains: search, mode: 'insensitive' } } },
                    { user: { email: { contains: search, mode: 'insensitive' } } },
                    { user: { phone: { contains: search, mode: 'insensitive' } } },
                    { id: { contains: search, mode: 'insensitive' } }
                ];
            }
            const rawWithdrawals = await prisma.withdrawal.findMany({
                where: wWhere,
                include: {
                    user: {
                        select: { id: true, username: true, name: true, email: true, phone: true }
                    }
                }
            });
            
            // Map withdrawals to look like transactions
            withdrawalsData = rawWithdrawals.map(w => ({
                id: w.id,
                userId: w.userId,
                type: 'WITHDRAW',
                amount: w.amount,
                detail: `Withdrawal (${w.status})`,
                createdAt: w.createdAt,
                user: w.user
            }));
        }

        // 3. Merge, Sort, and Paginate in memory
        let merged = [...transactionsData, ...withdrawalsData];
        
        merged.sort((a, b) => {
            let valA = a[sortBy];
            let valB = b[sortBy];
            
            // Handle date sorting
            if (sortBy === 'createdAt') {
                valA = new Date(valA).getTime();
                valB = new Date(valB).getTime();
            }

            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        const total = merged.length;
        const totalPages = Math.ceil(total / limit);
        const paginated = merged.slice(skip, skip + limit);

        res.json({
            ok: true,
            transactions: paginated,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasPrev: page > 1,
                hasNext: page < totalPages
            }
        });
    } catch (err) {
        console.error('[ADMIN_TRANSACTIONS]', err);
        res.status(500).json({ ok: false, error: 'Failed to fetch transactions' });
    }
});

// GET /api/admin/transactions/summary - Get transaction type summary
router.get('/summary', authenticate, adminOnly, async (req, res) => {
    try {
        const [summary, withdrawals] = await Promise.all([
            prisma.transaction.groupBy({
                by: ['type'],
                _sum: { amount: true },
                _count: { id: true }
            }),
            prisma.withdrawal.aggregate({
                _sum: { amount: true },
                _count: { id: true },
                where: {
                    status: { in: ['APPROVED', 'COMPLETED'] }
                }
            })
        ]);

        const result = {};
        summary.forEach(s => {
            result[s.type] = {
                total: s._sum.amount || 0,
                count: s._count.id
            };
        });

        // Add withdrawals manually from the Withdrawal table
        result['WITHDRAW'] = {
            total: withdrawals._sum.amount || 0,
            count: withdrawals._count.id || 0
        };

        res.json({ ok: true, summary: result });
    } catch (err) {
        console.error('[ADMIN_TRANSACTIONS_SUMMARY]', err);
        res.status(500).json({ ok: false, error: 'Failed to fetch summary' });
    }
});

module.exports = router;
