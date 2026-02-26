const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findUser() {
    const users = await prisma.user.findMany({
        where: {
            OR: [
                { leftMemberCount: { gte: 10 } },
                { rightMemberCount: { gte: 40 } },
                { leftCarryCount: { gt: 0 } },
            ]
        },
        select: {
            id: true, username: true,
            leftMemberCount: true, rightMemberCount: true,
            leftCarryCount: true, rightCarryCount: true,
            leftBV: true, rightBV: true
        }
    });

    console.log('Searching for user with Total Right Members = 69 and Paid Right Members = 20...');
    for (const u of users) {
        const totalPayoutAgg = await prisma.pairPayoutRecord.aggregate({
            where: { userId: u.id },
            _sum: { amount: true, leftConsumed: true, rightConsumed: true }
        });

        const paidLeftMembers = totalPayoutAgg._sum.leftConsumed || 0;
        const paidRightMembers = totalPayoutAgg._sum.rightConsumed || 0;
        const totalLeftMembers = paidLeftMembers + (u.leftMemberCount || 0) + (u.leftCarryCount || 0);
        const totalRightMembers = paidRightMembers + (u.rightMemberCount || 0) + (u.rightCarryCount || 0);

        if (totalRightMembers === 69 || totalLeftMembers === 31) {
            console.log('FOUND USER:', u.username, {
                paidLeftMembers, paidRightMembers,
                totalLeftMembers, totalRightMembers,
                dbLeftRaw: u.leftMemberCount, dbRightRaw: u.rightMemberCount,
                dbLeftCarry: u.leftCarryCount, dbRightCarry: u.rightCarryCount
            });
        }
    }
}
findUser().catch(console.error).finally(() => prisma.$disconnect());
