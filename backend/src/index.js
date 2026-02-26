console.log('[BOOT] index.js starting', {
    pid: process.pid,
    pm_id: process.env.pm_id,
    NODE_APP_INSTANCE: process.env.NODE_APP_INSTANCE,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    env: process.env
});
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors());
app.use(cookieParser());
app.use(express.json({ limit: '10kb' }));

// Request logging middleware
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${req.method}] ${req.path} - ${res.statusCode} - ${duration}ms`);
    });
    next();
});

// Rate limiting - disabled for stress testing
// const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
// app.use(limiter);

const authRouter = require('./routes/auth');
const userRouter = require('./routes/users');
const productRouter = require('./routes/products');
const adminProductRouter = require('./routes/adminProducts');
const withdrawalRouter = require('./routes/withdrawals');
const adminUserRouter = require('./routes/adminUsers');
const adminPositionsRouter = require('./routes/adminPositions');
const adminAnalyticsRouter = require('./routes/adminAnalytics');
const publicProducts = require('./routes/publicProducts');
const publicUsers = require('./routes/publicUsers');
const treeRouter = require('./routes/tree');
const referralsRouter = require('./routes/referrals');
const pairPayoutsRouter = require('./routes/pairPayouts');
const dashboardRouter = require('./routes/dashboard');
const queueStatsRouter = require('./routes/queueStats');
const { router: sseRouter } = require('./routes/sse');
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
app.use('/api/public/products', publicProducts);
app.use('/api/public/users', publicUsers);
app.use('/api/tree', treeRouter);
app.use('/api/referrals', referralsRouter);
app.use('/api/pair-payouts', pairPayoutsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/queue', queueStatsRouter);
app.use('/api/sse', sseRouter);
app.use('/api/kyc', kycRouter);
app.use('/api/payment', authenticate, paymentRouter);
app.use('/api/payouts', authenticate, payoutsRouter);
app.use('/api/receipt', authenticate, receiptRouter);
app.use('/api/orders', authenticate, ordersRouter);

app.get('/', (req, res) => res.json({ ok: true, message: 'MLM Backend Running' }));

// Start matching worker (BullMQ) - requires Redis
try {
    require('./queues/workers/matchingWorker');
    console.log('Matching worker started');
} catch (err) {
    console.warn('Matching worker not started (Redis may not be available):', err.message);
}

// Start receipt email worker (BullMQ) - requires Redis
try {
    require('./queues/workers/receiptEmailWorker');
    console.log('Receipt email worker started');
} catch (err) {
    console.warn('Receipt email worker not started (Redis may not be available):', err.message);
}

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

