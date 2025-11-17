const { Queue } = require('bullmq');
const IORedis = require('ioredis');

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });
const queue = new Queue('matching', { connection });

async function promoteAll() {
    const delayed = await queue.getJobs(['delayed'], 0, 1000);
    console.log('Found delayed jobs:', delayed.length);
    for (const j of delayed) {
        try {
            const job = await queue.getJob(j.id);
            if (job) {
                await job.promote();
                console.log('Promoted job', job.id);
            }
        } catch (e) {
            console.error('Failed to promote', j.id, e.message);
        }
    }
    await queue.close();
    await connection.quit();
}

promoteAll().catch(e => { console.error(e); process.exit(1); });
