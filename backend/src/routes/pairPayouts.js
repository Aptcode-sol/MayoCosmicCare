const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');

router.get('/me', authenticate, async (req, res) => {
    try {
        const prisma = require('../prismaClient');
        const records = await prisma.pairPayoutRecord.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        res.json({ ok: true, records });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

module.exports = router;
