const express = require('express');
const router = express.Router();
const { matchingQueue } = require('../queues/queue');

router.get('/stats', async (req, res) => {
    try {
        const jobCounts = await matchingQueue.getJobCounts();
        res.json({ ok: true, jobCounts });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

module.exports = router;
