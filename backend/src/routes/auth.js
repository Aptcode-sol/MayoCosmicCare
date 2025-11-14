const express = require('express');
const router = express.Router();
const { register, login, refreshToken, logoutRefresh, verifyEmail, requestPasswordReset, resetPassword } = require('../services/authService');
const { authenticate } = require('../middleware/authMiddleware');
const { registerSchema, loginSchema } = require('../validators/authValidators');

router.post('/register', async (req, res) => {
    try {
        const parsed = registerSchema.parse(req.body);
        const user = await register(parsed);
        res.json({ ok: true, user });
    } catch (err) {
        res.status(400).json({ ok: false, error: err.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const parsed = loginSchema.parse(req.body);
        const tokens = await login(parsed);
        res.json({ ok: true, tokens });
    } catch (err) {
        res.status(400).json({ ok: false, error: err.message });
    }
});

router.post('/refresh', async (req, res) => {
    try {
        const { refresh } = req.body;
        const tokens = await refreshToken(refresh);
        res.json({ ok: true, tokens });
    } catch (err) {
        res.status(400).json({ ok: false, error: err.message });
    }
});

router.post('/logout', authenticate, async (req, res) => {
    try {
        const { refresh } = req.body;
        await logoutRefresh(refresh);
        res.json({ ok: true });
    } catch (err) {
        res.status(400).json({ ok: false, error: err.message });
    }
});

router.get('/me', authenticate, async (req, res) => {
    res.json({ ok: true, user: req.user });
});

router.get('/verify-email/:token', async (req, res) => {
    try {
        const result = await verifyEmail(req.params.token);
        res.json({ ok: true, ...result });
    } catch (err) {
        res.status(400).json({ ok: false, error: err.message });
    }
});

router.post('/request-reset', async (req, res) => {
    try {
        const { email } = req.body;
        const result = await requestPasswordReset(email);
        res.json({ ok: true, ...result });
    } catch (err) {
        res.status(400).json({ ok: false, error: err.message });
    }
});

router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        const result = await resetPassword(token, newPassword);
        res.json({ ok: true, ...result });
    } catch (err) {
        res.status(400).json({ ok: false, error: err.message });
    }
});

module.exports = router;
