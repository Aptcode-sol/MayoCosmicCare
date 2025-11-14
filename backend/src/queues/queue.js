const { Queue } = require('bullmq');
const IORedis = require('ioredis');

// Configure ioredis options to avoid BullMQ deprecation warnings and make retries explicit
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });

// Default job options provide basic retries + exponential backoff for robustness
const matchingQueue = new Queue('matching', {
    connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 }
    }
});

module.exports = { matchingQueue };
