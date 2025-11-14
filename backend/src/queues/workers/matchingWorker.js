const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const { processMatchingBonus } = require('../../services/commissionService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Use explicit redis options to avoid BullMQ deprecation warnings
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });

const worker = new Worker('matching', async job => {
    const { userId } = job.data;
    try {
        await processMatchingBonus(prisma, userId);
        try { const { info } = require('../../logger'); info('matching_job_completed', { jobId: job.id, userId }); } catch (e) { }
    } catch (err) {
        console.error('Error processing matching bonus for', userId, err);
        try { const { error } = require('../../logger'); error('matching_job_failed', { jobId: job.id, userId, err: err.message }); } catch (e) { }
        throw err; // allow BullMQ to handle retries
    }
}, { connection, concurrency: 5 });

worker.on('completed', job => console.log('Matching job completed', job.id));
worker.on('failed', (job, err) => console.error('Matching job failed', job.id, err));

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down matching worker...');
    await worker.close();
    process.exit(0);
});

module.exports = worker;
