const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authenticate } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');

router.use(authenticate, requireAdmin);

router.post('/', async (req, res) => {
    try {
        const data = req.body;
        const p = await prisma.product.create({ data });
        res.json({ ok: true, product: p });
    } catch (err) {
        res.status(400).json({ ok: false, error: err.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const p = await prisma.product.update({ where: { id: req.params.id }, data: req.body });
        res.json({ ok: true, product: p });
    } catch (err) {
        res.status(400).json({ ok: false, error: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        await prisma.product.delete({ where: { id: req.params.id } });
        res.json({ ok: true });
    } catch (err) {
        res.status(400).json({ ok: false, error: err.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const list = await prisma.product.findMany();
        res.json({ ok: true, products: list });
    } catch (err) {
        res.status(400).json({ ok: false, error: err.message });
    }
});

module.exports = router;
