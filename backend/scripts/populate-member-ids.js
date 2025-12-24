// Script to populate memberId for existing users
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function populateMemberIds() {
    // Get all users ordered by createdAt
    const users = await prisma.user.findMany({
        where: { memberId: null },
        orderBy: { createdAt: 'asc' }
    });

    console.log(`Found ${users.length} users without memberId`);

    // Get the highest existing member number
    const existingUsers = await prisma.user.findMany({
        where: { memberId: { not: null } },
        select: { memberId: true }
    });

    let maxNumber = 0;
    for (const u of existingUsers) {
        const num = parseInt(u.memberId.replace('mcc', ''), 10);
        if (num > maxNumber) maxNumber = num;
    }

    console.log(`Starting from number ${maxNumber + 1}`);

    // Update each user
    for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const newNumber = maxNumber + i + 1;
        const memberId = 'mcc' + String(newNumber).padStart(8, '0');

        await prisma.user.update({
            where: { id: user.id },
            data: { memberId }
        });

        console.log(`Updated user ${user.username} -> ${memberId}`);
    }

    console.log('Done!');
    await prisma.$disconnect();
}

populateMemberIds().catch(console.error);
