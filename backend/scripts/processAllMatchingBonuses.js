/**
 * Process Matching Bonuses for ALL Users
 * 
 * This script processes matching bonuses for all users who have:
 * 1. Made a purchase (hasPurchased = true)
 * 2. Have BV accumulated in their tree (leftBV > 0 or rightBV > 0)
 * 
 * Run after stress test to calculate all pending matching bonuses
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { processMatchingBonus } = require('../src/services/commissionService');

async function run() {
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║         Process Matching Bonuses for All Users                ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    try {
        // Get all users who have purchased and have BV in their tree
        const users = await prisma.user.findMany({
            where: {
                hasPurchased: true,
                OR: [
                    { leftBV: { gt: 0 } },
                    { rightBV: { gt: 0 } }
                ]
            },
            orderBy: { createdAt: 'asc' }, // Process oldest first (bottom-up in tree)
            select: {
                id: true,
                username: true,
                email: true,
                leftBV: true,
                rightBV: true,
                leftCarryBV: true,
                rightCarryBV: true
            }
        });

        console.log(`Found ${users.length} users with BV to process\n`);

        let processed = 0;
        let failed = 0;
        let totalPayout = 0;

        for (const user of users) {
            try {
                console.log(`Processing: ${user.username || user.email} (${user.id.slice(-6)})...`);
                console.log(`  Left BV: ${user.leftBV} (Carry: ${user.leftCarryBV})`);
                console.log(`  Right BV: ${user.rightBV} (Carry: ${user.rightCarryBV})`);

                const result = await processMatchingBonus(prisma, user.id);

                if (result && result.bonus > 0) {
                    console.log(`  ✓ Matching bonus: ₹${result.bonus}`);
                    totalPayout += result.bonus;
                } else {
                    console.log(`  - No matching bonus (pairs: ${result?.pairs || 0})`);
                }

                processed++;
            } catch (err) {
                console.error(`  ✗ Error: ${err.message}`);
                failed++;
            }
            console.log('');
        }

        console.log('╔═══════════════════════════════════════════════════════════════╗');
        console.log('║                         SUMMARY                               ║');
        console.log('╠═══════════════════════════════════════════════════════════════╣');
        console.log(`║  Users Processed: ${processed}/${users.length}                              ║`);
        console.log(`║  Failed: ${failed}                                                  ║`);
        console.log(`║  Total Matching Bonus Paid: ₹${totalPayout.toLocaleString()}                    ║`);
        console.log('╚═══════════════════════════════════════════════════════════════╝');

    } catch (e) {
        console.error('Fatal error:', e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

run().then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
