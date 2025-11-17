const { Queue } = require('bullmq');
const IORedis = require('ioredis');

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });
const queue = new Queue('matching', { connection });

async function stats() {
    const counts = await queue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed');
    console.log('Queue counts:', counts);
    const failed = await queue.getJobs(['failed'], 0, 10);
    console.log('Recent failed jobs:', failed.map(j => ({ id: j.id, name: j.name, failedReason: j.failedReason, attemptsMade: j.attemptsMade })));
    await queue.close();
    await connection.quit();
}

stats().catch(e => { console.error(e); process.exit(1); });
