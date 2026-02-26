const express = require('express');
const router = express.Router();
const { purchaseProduct } = require('../services/purchaseService');
const { authenticate } = require('../middleware/authMiddleware');

router.post('/:productId/purchase', authenticate, async (req, res) => {
    try {
        // console.log('[PURCHASE-ROUTE] Starting purchase for user:', req.user.id, 'product:', req.params.productId);
        const userId = req.user.id;
        const { sponsorId, leg } = req.body;
        const result = await purchaseProduct(userId, req.params.productId, sponsorId, leg);
        // console.log('[PURCHASE-ROUTE] Purchase successful:', result);
        res.json({ ok: true, result });
    } catch (err) {
        console.error('[PURCHASE-ROUTE] ERROR:', err.message);
        console.error('[PURCHASE-ROUTE] Stack:', err.stack);
        res.status(400).json({ ok: false, error: err.message });
    }
});

module.exports = router;
