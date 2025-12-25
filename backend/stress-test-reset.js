/**
 * Reset script for stress testing v2
 * - Clears ALL non-admin users
 * - Restores product stock to 1000
 * - Resets admin BV
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function reset() {
    console.log('🧹 Resetting ALL test data...\n');

    // Find all non-admin users
    console.log('📋 Finding all non-admin users...');
    const users = await prisma.user.findMany({
        where: { role: 'USER' },
        select: { id: true, username: true }
    });

    console.log(`Found ${users.length} users to delete`);

    if (users.length > 0) {
        const userIds = users.map(u => u.id);

        // Delete related records first
        console.log('Deleting daily pair counters...');
        await prisma.dailyPairCounter.deleteMany({ where: { userId: { in: userIds } } });

        console.log('Deleting pair payout records...');
        await prisma.pairPayoutRecord.deleteMany({ where: { userId: { in: userIds } } });

        console.log('Deleting transactions...');
        await prisma.transaction.deleteMany({ where: { userId: { in: userIds } } });

        console.log('Deleting wallets...');
        await prisma.wallet.deleteMany({ where: { userId: { in: userIds } } });

        console.log('Deleting refresh tokens...');
        await prisma.refreshToken.deleteMany({ where: { userId: { in: userIds } } });

        console.log('Deleting withdrawals...');
        await prisma.withdrawal.deleteMany({ where: { userId: { in: userIds } } });

        console.log('Deleting users...');
        await prisma.user.deleteMany({ where: { id: { in: userIds } } });

        console.log(`✅ Deleted ${users.length} users and their data\n`);
    }

    // Also delete admin's transactions (to clear bonus records)
    console.log('Clearing admin transactions...');
    await prisma.transaction.deleteMany({ where: { user: { role: 'ADMIN' } } });

    // Restore product stock
    console.log('📦 Restoring product stock...');
    const product = await prisma.product.findFirst();
    if (product) {
        await prisma.product.update({
            where: { id: product.id },
            data: { stock: 1000 }
        });
        console.log(`✅ Product "${product.name}" stock restored to 1000\n`);
    }

    // Reset admin's BV and wallet
    console.log('👤 Resetting admin stats...');
    await prisma.user.updateMany({
        where: { role: 'ADMIN' },
        data: {
            leftBV: 0,
            rightBV: 0,
            leftCarryBV: 0,
            rightCarryBV: 0,
            leftCarryCount: 0,
            rightCarryCount: 0,
            leftMemberCount: 0,
            rightMemberCount: 0
        }
    });

    // Reset admin wallet
    await prisma.wallet.updateMany({
        where: { user: { role: 'ADMIN' } },
        data: { balance: 0 }
    });
    console.log('✅ Admin stats and wallet reset\n');

    console.log('✨ Reset complete! Ready for stress test v2.');
}

reset()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
