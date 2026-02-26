const { Worker } = require('bullmq');
const { processMatchingBonus } = require('../../services/commissionService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Only enable Redis if explicitly set to 'true'
const REDIS_ENABLED = process.env.REDIS_ENABLED === 'true';

let worker = null;

if (REDIS_ENABLED) {
    const IORedis = require('ioredis');
    const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

    try {
        const connection = new IORedis(redisUrl, {
            maxRetriesPerRequest: null,
            retryStrategy: (times) => {
                if (times > 3) {
                    console.warn('Redis connection failed after 3 attempts, worker disabled');
                    return null;
                }
                return Math.min(times * 100, 3000);
            }
        });

        connection.on('error', (err) => {
            console.warn('Redis connection error:', err.message);
        });

        worker = new Worker('matching', async job => {
            const { userId } = job.data;
            try {
                await processMatchingBonus(prisma, userId);
                try { const { info } = require('../../logger'); info('matching_job_completed', { jobId: job.id, userId }); } catch (e) { }
            } catch (err) {
                console.error('Error processing matching bonus for', userId, err);
                try { const { error } = require('../../logger'); error('matching_job_failed', { jobId: job.id, userId, err: err.message }); } catch (e) { }
                throw err;
            }
        }, { connection, concurrency: 5 });

        worker.on('completed', job => console.log('Matching job completed', job.id));
        worker.on('failed', (job, err) => console.error('Matching job failed', job.id, err));

        console.log('Matching worker started (Redis enabled)');
    } catch (err) {
        console.warn('Could not initialize matching worker:', err.message);
    }
} else {
    console.log('Matching worker disabled (set REDIS_ENABLED=true to enable)');
}

// Graceful shutdown

// Only exit process if not running as a PM2 cluster worker
process.on('SIGINT', async () => {
    if (worker) {
        console.log('Shutting down matching worker...');
        await worker.close();
    }
    // Only exit if not a PM2 cluster worker
    if (!process.env.NODE_APP_INSTANCE && !process.env.pm_id) {
        process.exit(0);
    }
});

module.exports = worker;
