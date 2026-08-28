// Loaded directly by `npm run worker:matching`, so it must bootstrap its own env.
// Without this, REDIS_ENABLED/DATABASE_URL are undefined and the standalone
// worker silently prints "disabled" and exits — it has never actually worked.
require('dotenv').config();

const { Worker } = require('bullmq');
const { processMatchingBonus } = require('../../services/commissionService');
const { workerConnection } = require('../redisConnection');
const { info, error, rateLimited } = require('../../logger');
const prisma = require('../../prismaClient');

const REDIS_ENABLED = process.env.REDIS_ENABLED === 'true';
const CONCURRENCY = Number(process.env.MATCHING_CONCURRENCY || 5);

let worker = null;

if (REDIS_ENABLED) {
    const connection = workerConnection('matching-worker');

    worker = new Worker('matching', async (job) => {
        const { userId } = job.data;
        try {
            await processMatchingBonus(prisma, userId);
            info('matching_job_completed', { jobId: job.id, userId });
        } catch (err) {
            error('matching_job_failed', { jobId: job.id, userId, err: err.message });
            throw err; // let BullMQ retry (requires the QueueScheduler)
        }
    }, { connection, concurrency: CONCURRENCY });

    worker.on('failed', (job, err) => {
        error('matching_job_failed_event', { jobId: job?.id, err: err?.message });
    });

    // Previously absent. A dead connection makes BullMQ hot-loop moveToActive,
    // and without a rate limit that wrote ~1GB of identical stack traces to disk.
    worker.on('error', (err) => {
        rateLimited('worker:matching', 'matching_worker_error', { err: err.message });
    });

    info('matching_worker_started', { concurrency: CONCURRENCY });
    console.log('Matching worker started (Redis enabled)');
} else {
    console.log('Matching worker disabled (set REDIS_ENABLED=true to enable)');
}

async function shutdown(signal) {
    console.log(`[matching-worker] ${signal} received, draining...`);
    try {
        if (worker) await worker.close(); // waits for in-flight jobs
    } catch (err) {
        error('matching_worker_shutdown_error', { err: err.message });
    }
    // Only own the exit when running standalone; under PM2 cluster the API
    // process manages its own lifecycle.
    if (!process.env.NODE_APP_INSTANCE && !process.env.pm_id) {
        process.exit(0);
    }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM')); // PM2 sends SIGTERM, not SIGINT

module.exports = worker;
