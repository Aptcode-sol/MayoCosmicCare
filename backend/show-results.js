/**
 * Show actual results from the stress test - Simple version
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function showResults() {
    console.log('\n========== ACTUAL TEST RESULTS ==========\n');

    // Count users
    const leftUsers = await prisma.user.count({ where: { username: { startsWith: 'left_user_' } } });
    const rightUsers = await prisma.user.count({ where: { username: { startsWith: 'right_user_' } } });
    const sanket = await prisma.user.findFirst({ where: { username: 'sanket' } });

    console.log('USERS CREATED:');
    console.log('  Sanket:', sanket ? 'Created' : 'Not found');
    console.log('  Left side users:', leftUsers);
    console.log('  Right side users:', rightUsers);
    console.log('  TOTAL:', leftUsers + rightUsers + (sanket ? 1 : 0), 'users');

    // Get product stock
    const product = await prisma.product.findFirst({ select: { stock: true, name: true } });
    console.log('\nProduct stock:', product?.stock);
    console.log('Purchases made:', 1000 - (product?.stock || 0));

    // Get sanket's details
    if (sanket) {
        const sanketWallet = await prisma.wallet.findUnique({ where: { userId: sanket.id } });
        const sanketTransactions = await prisma.transaction.findMany({
            where: { userId: sanket.id }
        });

        const directBonusSum = sanketTransactions
            .filter(t => t.type === 'DIRECT_BONUS')
            .reduce((sum, t) => sum + t.amount, 0);

        const matchingBonusSum = sanketTransactions
            .filter(t => t.type === 'MATCHING_BONUS')
            .reduce((sum, t) => sum + t.amount, 0);

        console.log('\nSANKET EARNINGS:');
        console.log('  Wallet Balance: Rs.', sanketWallet?.balance || 0);
        console.log('  Direct Bonus: Rs.', directBonusSum);
        console.log('  Matching Bonus: Rs.', matchingBonusSum);

        // Show sanket's BV
        const sanketFull = await prisma.user.findUnique({
            where: { id: sanket.id },
            select: { leftBV: true, rightBV: true, leftMemberCount: true, rightMemberCount: true }
        });
        console.log('  Left BV:', sanketFull?.leftBV || 0, '| Right BV:', sanketFull?.rightBV || 0);
        console.log('  Left Members:', sanketFull?.leftMemberCount || 0, '| Right Members:', sanketFull?.rightMemberCount || 0);
    }

    // Get admin's earnings
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (admin) {
        const adminWallet = await prisma.wallet.findUnique({ where: { userId: admin.id } });
        console.log('\nADMIN Wallet Balance: Rs.', adminWallet?.balance || 0);
    }

    // Expected vs actual
    console.log('\n========== EXPECTED VS ACTUAL ==========');

    const expectedDirectBonus = (leftUsers + rightUsers) * 500;
    console.log('\nExpected Sanket Direct Bonus: Rs.', expectedDirectBonus);
    console.log('  (' + (leftUsers + rightUsers) + ' referrals x Rs.500 each)');

    const pairs = Math.min(leftUsers, rightUsers);
    const expectedMatching = pairs * 700;
    console.log('\nExpected Sanket Matching Bonus: Rs.', expectedMatching);
    console.log('  (' + pairs + ' pairs x Rs.700 each)');

    console.log('\n=========================================\n');
}

showResults()
    .then(() => process.exit(0))
    .catch(err => console.error(err))
    .finally(() => prisma.$disconnect());
