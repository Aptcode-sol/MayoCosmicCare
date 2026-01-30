const { Queue } = require('bullmq');

// Only enable Redis if explicitly set to 'true'
const REDIS_ENABLED = process.env.REDIS_ENABLED === 'true';

let matchingQueue = null;

if (REDIS_ENABLED) {
    const IORedis = require('ioredis');
    const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

    try {
        const connection = new IORedis(redisUrl, {
            maxRetriesPerRequest: null,
            lazyConnect: true
        });

        matchingQueue = new Queue('matching', {
            connection,
            defaultJobOptions: {
                attempts: 3,
                backoff: { type: 'exponential', delay: 5000 }
            }
        });
    } catch (err) {
        console.warn('Could not initialize matching queue:', err.message);
    }
}

// Export a wrapper that checks if queue is available
module.exports = {
    matchingQueue,
    addMatchingJob: async (userId) => {
        if (matchingQueue) {
            return await matchingQueue.add('process-matching', { userId });
        } else {
            // Fallback: process matching synchronously without queue
            console.log('Queue not available, processing matching synchronously for', userId);
            const { PrismaClient } = require('@prisma/client');
            const prisma = new PrismaClient();
            try {
                const { processMatchingBonus } = require('../services/commissionService');
                await processMatchingBonus(prisma, userId);
            } catch (err) {
                console.error('Sync matching processing failed:', err.message);
            } finally {
                await prisma.$disconnect();
            }
        }
    }
};
