const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');

// Simple in-memory subscribers for payouts
const subscribers = new Set();

router.get('/payouts', (req, res) => {
    res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    res.flushHeaders();
    res.write('retry: 10000\n\n');
    const id = Date.now() + Math.random();
    subscribers.add(res);

    req.on('close', () => {
        subscribers.delete(res);
    });
});

// Used by worker to broadcast new payout
async function broadcastPayout(payout) {
    const payload = `data: ${JSON.stringify(payout)}\n\n`;
    for (const res of subscribers) {
        try { res.write(payload); } catch (e) { subscribers.delete(res); }
    }
}

// simple endpoint to tail worker logs
const { tailWorkerLogs } = require('../logger');
router.get('/worker-logs', (req, res) => tailWorkerLogs(res));

module.exports = { router, broadcastPayout };
