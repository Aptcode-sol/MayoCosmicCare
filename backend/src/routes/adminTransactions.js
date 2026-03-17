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

        // Build where clause
        const where = {};

        // Type filter
        if (typeFilter && typeFilter !== 'all') {
            where.type = typeFilter;
        }

        // Search by username, name, email, phone, or transaction detail
        if (search) {
            where.OR = [
                { user: { username: { contains: search, mode: 'insensitive' } } },
                { user: { name: { contains: search, mode: 'insensitive' } } },
                { user: { email: { contains: search, mode: 'insensitive' } } },
                { user: { phone: { contains: search, mode: 'insensitive' } } },
                { detail: { contains: search, mode: 'insensitive' } },
                { id: { contains: search, mode: 'insensitive' } }
            ];
        }

        // Build orderBy
        const orderBy = {};
        if (sortBy === 'amount') {
            orderBy.amount = sortOrder;
        } else {
            orderBy.createdAt = sortOrder;
        }

        const [transactions, total] = await Promise.all([
            prisma.transaction.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            name: true,
                            email: true,
                            phone: true
                        }
                    }
                },
                orderBy,
                skip,
                take: limit
            }),
            prisma.transaction.count({ where })
        ]);

        const totalPages = Math.ceil(total / limit);

        res.json({
            ok: true,
            transactions,
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
        const summary = await prisma.transaction.groupBy({
            by: ['type'],
            _sum: { amount: true },
            _count: { id: true }
        });

        const result = {};
        summary.forEach(s => {
            result[s.type] = {
                total: s._sum.amount || 0,
                count: s._count.id
            };
        });

        res.json({ ok: true, summary: result });
    } catch (err) {
        console.error('[ADMIN_TRANSACTIONS_SUMMARY]', err);
        res.status(500).json({ ok: false, error: 'Failed to fetch summary' });
    }
});

module.exports = router;
