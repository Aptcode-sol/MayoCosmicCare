const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const records = await prisma.pairPayoutRecord.findMany({ take: 5 });
    console.log('Sample pairPayoutRecords:');
    records.forEach(r => {
        console.log(`  User: ${r.userId.slice(0, 8)}..., pairs: ${r.pairs}, left: ${r.leftConsumed}, right: ${r.rightConsumed}`);
    });

    const sum = await prisma.pairPayoutRecord.aggregate({
        _sum: { leftConsumed: true, rightConsumed: true }
    });
    console.log('\nTotal consumed:', sum._sum);

    await prisma.$disconnect();
}

check().catch(e => { console.error(e); process.exit(1); });
