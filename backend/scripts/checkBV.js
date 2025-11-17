const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check(userId) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, username: true, leftBV: true, rightBV: true, leftCarryBV: true, rightCarryBV: true } });
    console.log('User BV:', user);
    const today = new Date(); today.setUTCHours(0, 0, 0, 0);
    const counter = await prisma.dailyPairCounter.findFirst({ where: { userId, date: today } });
    console.log('Today counter:', counter);
    const payouts = await prisma.pairPayoutRecord.findMany({ where: { userId }, orderBy: { date: 'desc' }, take: 5 });
    console.log('Recent payouts:', payouts);
}

const userId = process.argv[2];
if (!userId) { console.error('Usage: node checkBV.js <userId>'); process.exit(2); }
check(userId).then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
