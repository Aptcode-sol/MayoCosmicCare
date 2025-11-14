const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { matchingQueue } = require('./src/queues/queue');

async function main() {
    const users = await prisma.user.findMany({ where: { OR: [{ leftBV: { gt: 0 } }, { rightBV: { gt: 0 } }] } });
    for (const u of users) {
        await matchingQueue.add('matching-for-' + u.id, { userId: u.id });
    }
    console.log('Enqueued matching jobs for', users.length, 'users');
}

main().catch(e => console.error(e));
