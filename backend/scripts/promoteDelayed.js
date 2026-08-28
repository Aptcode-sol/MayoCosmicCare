require('dotenv').config();
const { Queue } = require('bullmq');
const { workerConnection } = require('../src/queues/redisConnection');

/**
 * Recover stuck matching jobs.
 *
 * Promotes `delayed` jobs AND retries `failed` ones. The old version only
 * handled `delayed`, so any job that exhausted its attempts stayed in `failed`
 * forever and was never recovered.
 *
 * With the QueueScheduler now running (src/queues/scheduler.js) delayed jobs
 * should promote themselves; this remains as a manual recovery tool.
 */

const connection = workerConnection('promote-delayed');
const queue = new Queue('matching', { connection });

async function recover() {
    const delayed = await queue.getJobs(['delayed'], 0, 1000);
    console.log('Delayed jobs found:', delayed.length);
    let promoted = 0;
    for (const j of delayed) {
        try { await j.promote(); promoted++; }
        catch (e) { console.error('Failed to promote', j.id, e.message); }
    }

    const failed = await queue.getJobs(['failed'], 0, 1000);
    console.log('Failed jobs found:', failed.length);
    let retried = 0;
    for (const j of failed) {
        try { await j.retry(); retried++; }
        catch (e) { console.error('Failed to retry', j.id, e.message); }
    }

    console.log(`Promoted ${promoted} delayed, retried ${retried} failed.`);
    console.log('Counts now:', JSON.stringify(await queue.getJobCounts()));

    await queue.close();
    await connection.quit();
}

recover().catch(e => { console.error(e); process.exit(1); });
