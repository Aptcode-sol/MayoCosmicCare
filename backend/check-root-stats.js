const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRootStats() {
    // Find root user
    const root = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    console.log('Root user ID:', root.id);

    // Get payout records for root
    const payouts = await prisma.pairPayoutRecord.findMany({ where: { userId: root.id } });
    console.log('\nPayout records for root:');
    payouts.forEach(p => {
        console.log(`  Pairs: ${p.pairs}, left: ${p.leftConsumed}, right: ${p.rightConsumed}, type: ${p.matchType}`);
    });

    // Aggregate
    const agg = await prisma.pairPayoutRecord.aggregate({
        where: { userId: root.id },
        _sum: { leftConsumed: true, rightConsumed: true }
    });
    console.log('\nRoot aggregates:');
    console.log('  leftConsumed total:', agg._sum.leftConsumed);
    console.log('  rightConsumed total:', agg._sum.rightConsumed);
    console.log('  leftPaidBV:', (agg._sum.leftConsumed || 0) * 7000);
    console.log('  rightPaidBV:', (agg._sum.rightConsumed || 0) * 7000);

    await prisma.$disconnect();
}

checkRootStats().catch(e => { console.error(e); process.exit(1); });
