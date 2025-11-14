const express = require('express');
const router = express.Router();
const { purchaseProduct } = require('../services/purchaseService');
const { authenticate } = require('../middleware/authMiddleware');

router.post('/:productId/purchase', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await purchaseProduct(userId, req.params.productId);
        res.json({ ok: true, result });
    } catch (err) {
        res.status(400).json({ ok: false, error: err.message });
    }
});

module.exports = router;
