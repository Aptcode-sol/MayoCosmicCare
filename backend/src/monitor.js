require('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.MONITOR_PORT || 4010;

// Bull Board (optional) - only if installed
try {
    const { createBullBoard } = require('@bull-board/express');
    const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
    const { matchingQueue } = require('./queues/queue');
    const router = express.Router();

    const { router: boardRouter } = createBullBoard({
        queues: [new BullMQAdapter(matchingQueue)],
    });

    // optional guard: provide MONITOR_SECRET in env and require ?s=<secret> on URL
    const secret = process.env.MONITOR_SECRET;
    if (secret) {
        app.use('/admin/queues', (req, res, next) => {
            if (req.query.s !== secret) return res.status(401).send('Unauthorized');
            next();
        }, boardRouter);
    } else {
        app.use('/admin/queues', boardRouter);
    }
    console.log('Bull Board available at /admin/queues');
} catch (err) {
    console.log('Bull Board not installed — skipping monitor UI');
}

app.listen(PORT, () => console.log(`Monitor running on ${PORT}`));
