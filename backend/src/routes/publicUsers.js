const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Public user search: ?q=term
router.get('/search', async (req, res) => {
    try {
        const q = String(req.query.q || '').trim();
        if (!q) return res.json({ users: [] });
        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { id: q },
                    { username: { contains: q, mode: 'insensitive' } },
                    { email: { contains: q, mode: 'insensitive' } },
                    // Support for sponsor codes (username + digit)
                    ...(/^\d$/.test(q.slice(-1)) ? [
                        { username: { equals: q.slice(0, -1), mode: 'insensitive' } },
                        { id: { equals: q.slice(0, -1) } }
                    ] : [])
                ]
            },
            select: { id: true, username: true, email: true },
            take: 10
        });
        res.json({ users });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Search failed' });
    }
});

module.exports = router;
