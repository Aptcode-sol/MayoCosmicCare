const { QueueScheduler } = require('bullmq');
const { workerConnection } = require('./redisConnection');
const { info, error, rateLimited } = require('../logger');

/**
 * BullMQ v1 requires a QueueScheduler per queue for ANY of the following to work:
 *   - retry backoff (our `attempts: 3, backoff: exponential` was inert without it)
 *   - promotion of delayed jobs back to waiting
 *   - recovery of stalled jobs (a job left `active` when a worker dies)
 *
 * We had none. That is why scripts/promoteDelayed.js exists as a manual
 * workaround, and why a failed job would sit in `delayed` forever.
 *
 * Merged into Worker in BullMQ v3+; keep this until that upgrade happens.
 */

const QUEUE_NAMES = ['matching', 'receipt-email'];

let schedulers = [];

function startSchedulers() {
    if (process.env.REDIS_ENABLED !== 'true') return [];
    if (schedulers.length) return schedulers; // idempotent

    schedulers = QUEUE_NAMES.map((name) => {
        const scheduler = new QueueScheduler(name, {
            connection: workerConnection(`scheduler-${name}`)
        });
        scheduler.on('error', (err) => {
            rateLimited(`scheduler:${name}`, 'queue_scheduler_error', { queue: name, err: err.message });
        });
        return scheduler;
    });

    info('queue_schedulers_started', { queues: QUEUE_NAMES });
    return schedulers;
}

async function stopSchedulers() {
    await Promise.all(schedulers.map(async (s) => {
        try { await s.close(); } catch (err) { error('scheduler_close_error', { err: err.message }); }
    }));
    schedulers = [];
}

module.exports = { startSchedulers, stopSchedulers, QUEUE_NAMES };
