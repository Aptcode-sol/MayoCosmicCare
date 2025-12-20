const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMemberCounts() {
    try {
        // Find admin/root user
        const admin = await prisma.user.findFirst({
            where: { role: 'ADMIN' },
            select: {
                id: true,
                username: true,
                leftMemberCount: true,
                rightMemberCount: true,
                leftCarryCount: true,
                rightCarryCount: true
            }
        });

        console.log('=== MEMBER COUNT CHECK ===');
        console.log('Admin:', admin?.username);
        console.log('Left Members:', admin?.leftMemberCount || 0);
        console.log('Right Members:', admin?.rightMemberCount || 0);
        console.log('Left Carry:', admin?.leftCarryCount || 0);
        console.log('Right Carry:', admin?.rightCarryCount || 0);

        // Count total users
        const totalUsers = await prisma.user.count();
        console.log('Total users in DB:', totalUsers);

        // Count users with parentId set
        const usersWithParent = await prisma.user.count({
            where: { parentId: { not: null } }
        });
        console.log('Users with parentId:', usersWithParent);

        // Check if we need to recalculate
        if (admin && (admin.leftMemberCount === 0 && admin.rightMemberCount === 0) && totalUsers > 1) {
            console.log('\n⚠️  Member counts are 0 but users exist.');
            console.log('This means users were added before member count propagation was implemented.');
            console.log('Run: node recalculate_members.js to fix this.');
        }

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkMemberCounts();
