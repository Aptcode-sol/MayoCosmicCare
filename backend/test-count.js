const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
    console.log('Total DB users:', await prisma.user.count());

    // Find the main user (excluding admin)
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    const users = await prisma.user.findMany({
        where: { role: 'USER' },
        orderBy: { createdAt: 'asc' },
        take: 1
    });

    const rootUser = users[0];
    console.log('Root user:', rootUser.username, rootUser.id);

    // Get their counts
    const userRec = await prisma.user.findUnique({
        where: { id: rootUser.id },
        select: { leftMemberCount: true, rightMemberCount: true, leftCarryCount: true, rightCarryCount: true }
    });
    console.log('Main user counts:', userRec);

}
run().finally(() => prisma.$disconnect());
