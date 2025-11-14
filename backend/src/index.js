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

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use(limiter);

const authRouter = require('./routes/auth');
const userRouter = require('./routes/users');
const productRouter = require('./routes/products');
const adminProductRouter = require('./routes/adminProducts');
const withdrawalRouter = require('./routes/withdrawals');
const adminUserRouter = require('./routes/adminUsers');
const publicProducts = require('./routes/publicProducts');
const treeRouter = require('./routes/tree');
const referralsRouter = require('./routes/referrals');
const pairPayoutsRouter = require('./routes/pairPayouts');
const queueStatsRouter = require('./routes/queueStats');
const { router: sseRouter } = require('./routes/sse');

app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/products', productRouter);
app.use('/api/admin/products', adminProductRouter);
app.use('/api/withdrawals', withdrawalRouter);
app.use('/api/admin/users', adminUserRouter);
app.use('/api/public/products', publicProducts);
app.use('/api/tree', treeRouter);
app.use('/api/referrals', referralsRouter);
app.use('/api/pair-payouts', pairPayoutsRouter);
app.use('/api/queue', queueStatsRouter);
app.use('/api/sse', sseRouter);

app.get('/', (req, res) => res.json({ ok: true, message: 'MLM Backend Running' }));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
