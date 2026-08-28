// console.log('[BOOT] index.js starting', {
//     pid: process.pid,
//     pm_id: process.env.pm_id,
//     NODE_APP_INSTANCE: process.env.NODE_APP_INSTANCE,
//     uptime: process.uptime(),
//     memory: process.memoryUsage(),
//     env: process.env
// });
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { info, error } = require('./logger');

const app = express();
const PORT = process.env.PORT || 4000;
const CASHFREE_ENV = process.env.CASHFREE_ENV || 'SANDBOX';

app.use(helmet());
app.use(cors());
app.use(cookieParser());
app.use(express.json({ limit: '10kb' }));

// Request logging. Off by default: this logged EVERY request and was the main
// contributor to the unbounded PM2 logs that filled the 8GB root volume.
// Set REQUEST_LOGGING=true to re-enable for debugging.
if (process.env.REQUEST_LOGGING === 'true') {
    app.use((req, res, next) => {
        const start = Date.now();
        res.on('finish', () => {
            console.log(`[${new Date().toISOString()}] [${req.method}] ${req.originalUrl} - ${res.statusCode} - ${Date.now() - start}ms`);
        });
        next();
    });
}

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use(limiter);

const authRouter = require('./routes/auth');
const userRouter = require('./routes/users');
const productRouter = require('./routes/products');
const adminProductRouter = require('./routes/adminProducts');
const withdrawalRouter = require('./routes/withdrawals');
const adminUserRouter = require('./routes/adminUsers');
const adminPositionsRouter = require('./routes/adminPositions');
const adminAnalyticsRouter = require('./routes/adminAnalytics');
const adminTransactionsRouter = require('./routes/adminTransactions');
const publicProducts = require('./routes/publicProducts');
const publicUsers = require('./routes/publicUsers');
const treeRouter = require('./routes/tree');
const referralsRouter = require('./routes/referrals');
const pairPayoutsRouter = require('./routes/pairPayouts');
const dashboardRouter = require('./routes/dashboard');
const kycRouter = require('./routes/kyc');
const paymentRouter = require('./routes/payment');
const payoutsRouter = require('./routes/payouts');
const receiptRouter = require('./routes/receipt');
const ordersRouter = require('./routes/orders');
const { authenticate } = require('./middleware/authMiddleware');

app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/products', productRouter);
app.use('/api/admin/products', adminProductRouter);
app.use('/api/withdrawals', withdrawalRouter);
app.use('/api/admin/users', adminUserRouter);
app.use('/api/admin/positions', adminPositionsRouter);
app.use('/api/admin/analytics', adminAnalyticsRouter);
app.use('/api/admin/transactions', adminTransactionsRouter);
app.use('/api/public/products', publicProducts);
app.use('/api/public/users', publicUsers);
app.use('/api/tree', treeRouter);
app.use('/api/referrals', referralsRouter);
app.use('/api/pair-payouts', pairPayoutsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/kyc', kycRouter);
app.use('/api/payment', authenticate, paymentRouter);
app.use('/api/payouts', authenticate, payoutsRouter);
app.use('/api/receipt', authenticate, receiptRouter);
app.use('/api/orders', authenticate, ordersRouter);

app.get('/', (req, res) => res.json({ ok: true, message: 'MLM Backend Running' }));

/**
 * Real health check.
 *
 * The queue block is the important part: during the outage the API was healthy,
 * Redis was reachable, and jobs were being enqueued fine — but nothing was
 * consuming them. `waiting` climbing with `workers: 0` is the signal that would
 * have caught it in hours instead of seven weeks. Alarm on those two.
 */
app.get('/health', async (req, res) => {
    const prisma = require('./prismaClient');
    const { matchingQueue } = require('./queues/queue');
    const out = { ok: false, db: 'down', redis: 'down', queue: null, workers: null, oldestWaitingMs: null };

    // Never echo raw driver errors here: this endpoint is unauthenticated and
    // Prisma/ioredis messages embed the DB and Redis host:port.
    try {
        await prisma.$queryRaw`SELECT 1`;
        out.db = 'up';
    } catch (err) {
        out.db = 'down';
        console.error('[health] db check failed:', err.message);
    }

    if (matchingQueue) {
        try {
            out.queue = await matchingQueue.getJobCounts();
            out.redis = 'up';
            out.workers = (await matchingQueue.getWorkers()).length;

            const [oldest] = await matchingQueue.getWaiting(0, 0);
            if (oldest?.timestamp) out.oldestWaitingMs = Date.now() - oldest.timestamp;
        } catch (err) {
            out.redis = 'down';
            console.error('[health] redis check failed:', err.message);
        }
    } else {
        out.redis = 'disabled';
    }

    // Degraded, not down, if Redis is off: the inline fallback still pays out.
    out.ok = out.db === 'up' && out.redis !== 'down';
    res.status(out.ok ? 200 : 503).json(out);
});

// QueueScheduler: required in BullMQ v1 for retries, delayed-job promotion and
// stalled-job recovery. Only one instance should run it, hence the guard.
// Phase 2 moves this into a dedicated worker process.
if (!process.env.NODE_APP_INSTANCE || process.env.NODE_APP_INSTANCE === '0') {
    try {
        require('./queues/scheduler').startSchedulers();
    } catch (err) {
        console.warn('Queue schedulers not started:', err.message);
    }
}

// Start BullMQ workers. Each module no-ops unless REDIS_ENABLED=true and logs
// its own status, so don't claim "started" here — that was misleading.
// Note these run in EVERY cluster instance; Phase 2 moves them to a dedicated
// single worker process.
try {
    require('./queues/workers/matchingWorker');
} catch (err) {
    console.warn('Matching worker failed to load:', err.message);
}

try {
    require('./queues/workers/receiptEmailWorker');
} catch (err) {
    console.warn('Receipt email worker failed to load:', err.message);
}

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

