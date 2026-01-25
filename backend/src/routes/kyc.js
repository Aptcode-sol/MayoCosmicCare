const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { initKyc, checkStatus } = require('../services/kycService');

router.post('/init', authenticate, async (req, res) => {
    try {
        const result = await initKyc(req.user.id);
        res.json({ ok: true, ...result });
    } catch (err) {
        console.error('KYC Init Error', err);
        res.status(500).json({ ok: false, error: err.message });
    }
});

router.get('/status', authenticate, async (req, res) => {
    try {
        const result = await checkStatus(req.user.id);
        res.json({ ok: true, ...result });
    } catch (err) {
        console.error('KYC Status Error', err);
        res.status(500).json({ ok: false, error: err.message });
    }
});

module.exports = router;
