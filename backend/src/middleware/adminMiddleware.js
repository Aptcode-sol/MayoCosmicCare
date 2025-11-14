function requireAdmin(req, res, next) {
    if (!req.user) return res.status(401).json({ ok: false, error: 'Not authenticated' });
    if (req.user.role !== 'ADMIN') return res.status(403).json({ ok: false, error: 'Admin required' });
    next();
}

module.exports = { requireAdmin };
