const { Queue } = require('bullmq');
const IORedis = require('ioredis');

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });
const queue = new Queue('matching', { connection });

async function find(userId) {
    const statuses = ['waiting', 'active', 'completed', 'failed', 'delayed'];
    for (const s of statuses) {
        const jobs = await queue.getJobs([s], 0, 100);
        for (const j of jobs) {
            try {
                const data = j.data || {};
                if (data.userId === userId) {
                    console.log('Found job', { id: j.id, name: j.name, status: s, attemptsMade: j.attemptsMade, failedReason: j.failedReason, timestamp: j.timestamp, data: j.data });
                }
            } catch (e) { }
        }
    }
    await queue.close();
    await connection.quit();
}

const userId = process.argv[2];
if (!userId) { console.error('Usage: node findUserJobs.js <userId>'); process.exit(2); }
find(userId).then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
