const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const changes = await prisma.rankChange.findMany({
        include: { user: { select: { username: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10
    });
    console.log('Recent Rank Changes:', changes.length);
    changes.forEach(c => {
        console.log(`  ${c.user.username}: ${c.fromRank} -> ${c.toRank} (${c.pairsAtChange} pairs) [Rewarded: ${c.rewarded}]`);
    });

    const admin = await prisma.user.findFirst({ where: { email: 'admin@gmail.com' } });
    console.log('\nAdmin:', admin.username, 'Rank:', admin.rank, 'Pairs:', admin.totalPairs, 'L:', admin.leftMemberCount, 'R:', admin.rightMemberCount);

    const sanket = await prisma.user.findFirst({ where: { username: 'sanket' } });
    if (sanket) {
        console.log('Sanket:', sanket.username, 'Rank:', sanket.rank, 'Pairs:', sanket.totalPairs, 'L:', sanket.leftMemberCount, 'R:', sanket.rightMemberCount);
    }
}
main().finally(() => prisma.$disconnect());
