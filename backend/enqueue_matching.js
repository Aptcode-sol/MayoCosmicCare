require('dotenv').config();
const prisma = require('./src/prismaClient');
const { addMatchingJob } = require('./src/queues/queue');

/**
 * Bulk re-enqueue matching jobs.
 *
 * Goes through addMatchingJob() rather than touching matchingQueue directly:
 * the old version dereferenced a possibly-null queue (crashing whenever
 * REDIS_ENABLED !== 'true') and used a non-standard job name. addMatchingJob
 * also falls back to inline processing if Redis is unavailable.
 *
 * Selection note: this filters on BV, which over-selects (BV increments on every
 * downline purchase, member counts only on the first). Harmless here — users with
 * nothing to pay are a no-op. Phase 2's sweep uses the correct predicate.
 */
async function main() {
    const users = await prisma.user.findMany({
        where: { OR: [{ leftBV: { gt: 0 } }, { rightBV: { gt: 0 } }] },
        select: { id: true }
    });

    let ok = 0, failed = 0;
    for (const u of users) {
        try { await addMatchingJob(u.id); ok++; }
        catch (e) { failed++; console.error('enqueue failed for', u.id, e.message); }
    }

    console.log(`Enqueued ${ok} matching jobs (${failed} failed) for ${users.length} users.`);
    await prisma.$disconnect();
    process.exit(0);
}

main().catch(async (e) => {
    console.error(e);
    await prisma.$disconnect().catch(() => {});
    process.exit(1);
});
