const express = require('express');
const router = express.Router();
const { getUserTree } = require('../services/userService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.get('/:id/tree', async (req, res) => {
    try {
        const tree = await getUserTree(req.params.id);
        res.json({ ok: true, tree });
    } catch (err) {
        res.status(400).json({ ok: false, error: err.message });
    }
});

router.get('/:id/wallet', async (req, res) => {
    try {
        const userId = req.params.id;
        const wallet = await prisma.wallet.findUnique({ where: { userId } });
        const txs = await prisma.transaction.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 20 });
        res.json({ ok: true, wallet, transactions: txs });
    } catch (err) {
        res.status(400).json({ ok: false, error: err.message });
    }
});

module.exports = router;

