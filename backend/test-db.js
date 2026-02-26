const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUserMatching() {
    const user = await prisma.user.findFirst({
        where: { username: 'M2601PF' }
    });

    const payouts = await prisma.pairPayoutRecord.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'asc' }
    });
    console.log('User Payout History:', payouts);

    // Sum consumed
    const totalPayoutAgg = await prisma.pairPayoutRecord.aggregate({
        where: { userId: user.id },
        _sum: { leftConsumed: true, rightConsumed: true }
    });
    console.log('Total Consumed Agg:', totalPayoutAgg);
}

checkUserMatching().catch(console.error).finally(() => prisma.$disconnect());
