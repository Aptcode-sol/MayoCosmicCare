const { Queue } = require('bullmq');
const { producerConnection } = require('./redisConnection');
const { info, error, rateLimited } = require('../logger');

const REDIS_ENABLED = process.env.REDIS_ENABLED === 'true';
const ADD_TIMEOUT_MS = Number(process.env.QUEUE_ADD_TIMEOUT_MS || 5000);

let matchingQueue = null;
let receiptEmailQueue = null;

if (REDIS_ENABLED) {
    try {
        const connection = producerConnection('queue-producer');

        // removeOnComplete/Fail matter: without them every job is retained in
        // Redis forever (we had 33k+ completed job hashes in ElastiCache), which
        // wastes memory and, under an eviction policy other than `noeviction`,
        // makes it likelier that live job data gets evicted.
        matchingQueue = new Queue('matching', {
            connection,
            defaultJobOptions: {
                attempts: 3,
                backoff: { type: 'exponential', delay: 5000 },
                removeOnComplete: 1000,
                removeOnFail: 5000
            }
        });

        receiptEmailQueue = new Queue('receipt-email', {
            connection,
            defaultJobOptions: {
                attempts: 3,
                backoff: { type: 'exponential', delay: 10000 },
                removeOnComplete: 500,
                removeOnFail: 1000
            }
        });

        for (const [name, q] of [['matching', matchingQueue], ['receipt-email', receiptEmailQueue]]) {
            q.on('error', (err) => {
                rateLimited(`queue:${name}`, 'queue_error', { queue: name, err: err.message });
            });
        }
    } catch (err) {
        error('queue_init_failed', { err: err.message });
    }
}

/**
 * Reject rather than hang forever if Redis is wedged.
 *
 * This is load-bearing, not belt-and-braces: verified that with Redis
 * unreachable, BullMQ v1's `.add()` never settles (it awaits its own
 * connection-readiness gate), so without this race the caller hangs forever and
 * the fallback below is never reached.
 */
function withTimeout(promise, ms, label) {
    let timer;
    return Promise.race([
        promise,
        new Promise((_, reject) => {
            timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
        })
    ]).finally(() => clearTimeout(timer));
}

/**
 * Pay a user's matching bonus in-process.
 *
 * Uses the shared Prisma singleton — the previous version constructed a
 * `new PrismaClient()` on every call, leaking a connection pool each time.
 */
async function runMatchingInline(userId) {
    const prisma = require('../prismaClient');
    const { processMatchingBonus } = require('../services/commissionService');
    try {
        return await processMatchingBonus(prisma, userId);
    } catch (err) {
        error('inline_matching_failed', { userId, err: err.message });
        return null;
    }
}

async function runReceiptInline(orderId) {
    const prisma = require('../prismaClient');
    try {
        const { getOrderDataForReceipt, renderReceiptHtml, generateReceiptPdf } = require('../services/receiptService');
        const { sendReceiptEmail } = require('../services/emailService');

        const orderData = await getOrderDataForReceipt(orderId);
        const order = await prisma.order.findUnique({ where: { id: orderId }, include: { user: true } });
        if (!order || !order.user) return null;

        const html = renderReceiptHtml(orderData);
        const pdfBuffer = await generateReceiptPdf(orderData);
        await sendReceiptEmail(order.user.email, orderData.receiptNo, html, pdfBuffer);
        return { ok: true };
    } catch (err) {
        error('inline_receipt_failed', { orderId, err: err.message });
        return null;
    }
}

/**
 * Enqueue a matching job, falling back to inline processing if that fails.
 *
 * The old version only fell back when `matchingQueue` was null — i.e. only when
 * Redis was deliberately disabled. When the queue object existed but its
 * connection was dead (the actual outage), .add() failed and the job was simply
 * lost: the purchase had already committed its BV/member-count updates, so the
 * member accrued pairs that nothing would ever pay. Now any add failure falls
 * through to the inline path.
 */
async function addMatchingJob(userId) {
    if (matchingQueue) {
        try {
            return await withTimeout(
                matchingQueue.add('process-matching', { userId }),
                ADD_TIMEOUT_MS,
                'matching enqueue'
            );
        } catch (err) {
            error('queue_add_failed_falling_back_inline', { userId, err: err.message });
        }
    }
    return runMatchingInline(userId);
}

async function addReceiptEmailJob(orderId) {
    if (receiptEmailQueue) {
        try {
            return await withTimeout(
                receiptEmailQueue.add('send-receipt', { orderId }),
                ADD_TIMEOUT_MS,
                'receipt enqueue'
            );
        } catch (err) {
            error('receipt_add_failed_falling_back_inline', { orderId, err: err.message });
        }
    }
    return runReceiptInline(orderId);
}

module.exports = {
    matchingQueue,
    receiptEmailQueue,
    addMatchingJob,
    addReceiptEmailJob,
    runMatchingInline
};
