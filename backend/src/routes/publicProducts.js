const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
    try {
        const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
        res.json({ ok: true, products });
    } catch (err) {
        console.error(err);
        res.status(500).json({ ok: false, error: 'Failed to fetch products' });
    }
});

module.exports = router;
