const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authenticate } = require('../middleware/authMiddleware');

async function getReferralsRecursive(userId, depth = 2) {
  if (depth <= 0) return [];
  const refs = await prisma.user.findMany({ where: { sponsorId: userId }, orderBy: { createdAt: 'asc' } });
  const nested = await Promise.all(refs.map(async (r) => ({
    id: r.id,
    username: r.username,
    position: r.position,
    children: await getReferralsRecursive(r.id, depth - 1)
  })));
  return nested;
}

router.get('/me', authenticate, async (req, res) => {
  try {
    const depth = parseInt(req.query.depth) || 3;
    const tree = await getReferralsRecursive(req.user.id, depth);
    res.json({ ok: true, tree: { id: req.user.id, children: tree } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Failed to fetch referrals' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const depth = parseInt(req.query.depth) || 3;
    const tree = await getReferralsRecursive(req.params.id, depth);
    res.json({ ok: true, tree: { id: req.params.id, children: tree } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Failed to fetch referrals' });
  }
});

module.exports = router;
