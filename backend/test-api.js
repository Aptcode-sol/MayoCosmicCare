const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testApi() {
    // 1. Find user from matching pairs
    const user = await prisma.user.findFirst({
        where: { role: 'ADMIN' }
    });

    // We will just do the math right here
    const userId = 'mcc330fd7858623417bb838cb4971377c9d'; // From earlier testing

    const u = await prisma.user.findUnique({ where: { id: userId } });
    if (!u) return console.log('User not found');

    const totalPayoutAgg = await prisma.pairPayoutRecord.aggregate({
        where: { userId },
        _sum: { amount: true, leftConsumed: true, rightConsumed: true }
    });

    const BV_PER_MEMBER = 50;

    const paidLeftMembers = totalPayoutAgg._sum.leftConsumed || 0;
    const paidRightMembers = totalPayoutAgg._sum.rightConsumed || 0;

    const totalLeftMembers = paidLeftMembers + (u.leftMemberCount || 0) + (u.leftCarryCount || 0);
    const totalRightMembers = paidRightMembers + (u.rightMemberCount || 0) + (u.rightCarryCount || 0);

    const matchablePairs = Math.min(totalLeftMembers, totalRightMembers);

    const unpaidLeftMembers = Math.max(0, totalLeftMembers - paidLeftMembers);
    const unpaidRightMembers = Math.max(0, totalRightMembers - paidRightMembers);

    const carryLeftMembers = Math.max(0, totalLeftMembers - totalRightMembers);
    const carryRightMembers = Math.max(0, totalRightMembers - totalLeftMembers);

    console.log({
        paidLeftMembers, paidRightMembers,
        totalLeftMembers, totalRightMembers,
        unpaidLeftMembers, unpaidRightMembers,
        carryLeftMembers, carryRightMembers
    });
}
testApi().catch(console.error).finally(() => prisma.$disconnect());
