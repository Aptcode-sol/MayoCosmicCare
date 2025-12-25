const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function showResults() {
    const testUsers = await prisma.user.count({
        where: {
            OR: [
                { username: { startsWith: 'left_user_' } },
                { username: { startsWith: 'right_user_' } }
            ]
        }
    });

    const product = await prisma.product.findFirst({ select: { stock: true, name: true } });

    const admin = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
        select: {
            username: true,
            leftBV: true,
            rightBV: true,
            leftMemberCount: true,
            rightMemberCount: true,
            wallet: { select: { balance: true } }
        }
    });

    const transactions = await prisma.transaction.count();

    console.log('\n╔═══════════════════════════════════════════════════╗');
    console.log('║              STRESS TEST SUMMARY                  ║');
    console.log('╠═══════════════════════════════════════════════════╣');
    console.log(`║  Test Users Created: ${testUsers}                           ║`);
    console.log(`║  Product Stock: ${product?.stock}                             ║`);
    console.log(`║  Total Transactions: ${transactions}                          ║`);
    console.log('╠═══════════════════════════════════════════════════╣');
    console.log('║  ADMIN STATS:                                     ║');
    console.log(`║  Wallet Balance: ₹${admin?.wallet?.balance?.toLocaleString() || 0}                         ║`);
    console.log(`║  Left BV: ${admin?.leftBV || 0} | Right BV: ${admin?.rightBV || 0}                  ║`);
    console.log(`║  Left Members: ${admin?.leftMemberCount || 0} | Right Members: ${admin?.rightMemberCount || 0}         ║`);
    console.log('╚═══════════════════════════════════════════════════╝\n');
}

showResults()
    .then(() => process.exit(0))
    .catch(err => console.error(err))
    .finally(() => prisma.$disconnect());
