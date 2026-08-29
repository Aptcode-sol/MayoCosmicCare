const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { buildTreeForUser, getAncestorPath, searchUsers } = require('../services/treeService');

router.get('/me', authenticate, async (req, res) => {
  try {
    const depth = parseInt(req.query.depth) || 3;
    const tree = await buildTreeForUser(req.user.id, depth);
    res.json({ ok: true, tree });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Failed to fetch referrals' });
  }
});

// Search within the caller's own downline, for "jump to member". Each match carries
// the full ancestor path (root-to-target) so the frontend can populate the
// breadcrumb and focus the tree on it in one round trip.
router.get('/search', authenticate, async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) return res.json({ ok: true, matches: [] });
    const raw = await searchUsers(q, 20);
    const matches = [];
    for (const m of raw) {
      const path = await getAncestorPath(m.id);
      if (path.some(p => p.id === req.user.id)) matches.push({ ...m, path }); // only if in MY downline
      if (matches.length >= 10) break;
    }
    res.json({ ok: true, matches });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Failed to search network' });
  }
});

// NOTE: previously had no `authenticate` middleware — anyone who knew/guessed a user
// id could fetch that user's full downline tree and wallet balance without logging in.
router.get('/:id', authenticate, async (req, res) => {
  try {
    const depth = parseInt(req.query.depth) || 3;
    const tree = await buildTreeForUser(req.params.id, depth);
    res.json({ ok: true, tree });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Failed to fetch referrals' });
  }
});

module.exports = router;
