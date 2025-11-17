const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check(userId) {
    const txs = await prisma.transaction.findMany({ where: { userId, type: 'MATCHING_BONUS' }, orderBy: { createdAt: 'desc' }, take: 10 });
    console.log('Matching transactions:', txs);
    const payouts = await prisma.pairPayoutRecord.findMany({ where: { userId }, orderBy: { date: 'desc' }, take: 10 });
    console.log('Pair payouts:', payouts);
    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    console.log('Wallet:', wallet);
}

const userId = process.argv[2];
if (!userId) { console.error('Usage: node checkPayouts.js <userId>'); process.exit(2); }
check(userId).then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
