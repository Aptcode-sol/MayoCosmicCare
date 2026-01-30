/**
 * Check All Bonus Stats
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    try {
        // Summary stats
        const totalDirectBonus = await prisma.transaction.aggregate({
            where: { type: 'DIRECT_BONUS' },
            _sum: { amount: true },
            _count: true
        });

        const totalMatchingBonus = await prisma.transaction.aggregate({
            where: { type: 'MATCHING_BONUS' },
            _sum: { amount: true },
            _count: true
        });

        const totalLeadershipBonus = await prisma.transaction.aggregate({
            where: { type: 'LEADERSHIP_BONUS' },
            _sum: { amount: true },
            _count: true
        });

        console.log('\n╔══════════════════════════════════════════════════════╗');
        console.log('║                 BONUS SUMMARY                         ║');
        console.log('╚══════════════════════════════════════════════════════╝\n');
        console.log(`Direct Bonus:     ₹${(totalDirectBonus._sum.amount || 0).toLocaleString().padStart(12)} (${totalDirectBonus._count} txns)`);
        console.log(`Matching Bonus:   ₹${(totalMatchingBonus._sum.amount || 0).toLocaleString().padStart(12)} (${totalMatchingBonus._count} txns)`);
        console.log(`Leadership Bonus: ₹${(totalLeadershipBonus._sum.amount || 0).toLocaleString().padStart(12)} (${totalLeadershipBonus._count} txns)`);
        console.log(`TOTAL:            ₹${((totalDirectBonus._sum.amount || 0) + (totalMatchingBonus._sum.amount || 0) + (totalLeadershipBonus._sum.amount || 0)).toLocaleString().padStart(12)}\n`);

        // Get Sanket's transactions
        const sanket = await prisma.user.findFirst({ where: { email: 'sanket@gmail.com' } });
        if (sanket) {
            const transactions = await prisma.transaction.findMany({
                where: {
                    userId: sanket.id,
                    type: { in: ['DIRECT_BONUS', 'MATCHING_BONUS', 'LEADERSHIP_BONUS'] }
                },
                orderBy: { createdAt: 'desc' }
            });

            console.log('╔══════════════════════════════════════════════════════╗');
            console.log('║            SANKET BONUS TRANSACTIONS                  ║');
            console.log('╚══════════════════════════════════════════════════════╝\n');

            if (transactions.length === 0) {
                console.log('❌ No bonus transactions for Sanket!\n');
            } else {
                let total = 0;
                for (const tx of transactions) {
                    console.log(`${tx.type.padEnd(20)} ₹${tx.amount.toString().padStart(8)} - ${tx.detail}`);
                    total += tx.amount;
                }
                console.log(`\nTotal: ₹${total.toLocaleString()}\n`);
            }

            // Check wallet
            const wallet = await prisma.wallet.findUnique({ where: { userId: sanket.id } });
            console.log('╔══════════════════════════════════════════════════════╗');
            console.log('║               SANKET WALLET                           ║');
            console.log('╚══════════════════════════════════════════════════════╝\n');
            console.log(`Wallet Balance: ₹${(wallet?.balance || 0).toLocaleString()}\n`);
        }

        // Check if there are matching bonus payouts
        const payouts = await prisma.pairPayoutRecord.count();
        const counters = await prisma.dailyPairCounter.findMany({
            include: { user: { select: { username: true } } },
            orderBy: { pairs: 'desc' },
            take: 10
        });

        console.log('╔══════════════════════════════════════════════════════╗');
        console.log('║         TOP 10 USERS BY PAIRS PROCESSED               ║');
        console.log('╚══════════════════════════════════════════════════════╝\n');
        console.log(`Total payout records: ${payouts}\n`);

        if (counters.length > 0) {
            for (const c of counters) {
                console.log(`${c.user.username.padEnd(12)} ${c.pairs.toString().padStart(4)} pairs on ${c.date.toLocaleDateString()}`);
            }
        } else {
            console.log('No pair counters found.\n');
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

run();
