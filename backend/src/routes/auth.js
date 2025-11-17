const express = require('express');
const router = express.Router();
const { register, login, refreshToken, logoutRefresh, verifyEmail, requestPasswordReset, resetPassword } = require('../services/authService');
const { authenticate } = require('../middleware/authMiddleware');
const { registerSchema, loginSchema } = require('../validators/authValidators');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.post('/register', async (req, res) => {
    try {
        const parsed = registerSchema.parse(req.body);
        const result = await register(parsed);
        // result may include emailVerifyToken in dev for simulation
        res.json({ ok: true, ...result });
    } catch (err) {
        if (err.name === 'ZodError') {
            const errors = {};
            for (const e of err.errors) {
                errors[e.path[0]] = e.message;
            }
            res.status(400).json({ ok: false, errors });
            return;
        }
        res.status(400).json({ ok: false, error: err.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const parsed = loginSchema.parse(req.body);
        const tokens = await login(parsed);
        res.json({ ok: true, tokens });
    } catch (err) {
        if (err.name === 'ZodError') {
            const errors = {};
            for (const e of err.errors) {
                errors[e.path[0]] = e.message;
            }
            res.status(400).json({ ok: false, errors });
            return;
        }
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
    try {
        const id = req.user?.id
        if (!id) return res.status(401).json({ ok: false, error: 'Not authenticated' })
        const userRec = await prisma.user.findUnique({
            where: { id },
            select: { id: true, username: true, email: true, role: true, createdAt: true }
        })
        // maintain legacy `name` field for API consumers by deriving from username
        const user = userRec ? { ...userRec, name: userRec.username } : null
        if (!user) return res.status(404).json({ ok: false, error: 'User not found' })
        res.json({ ok: true, user })
    } catch (err) {
        res.status(400).json({ ok: false, error: err.message })
    }
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
