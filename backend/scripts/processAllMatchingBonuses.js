/**
 * Process Matching Bonuses for ALL Users
 * 
 * This script processes matching bonuses for all users who have:
 * 1. Made a purchase (hasPurchased = true)
 * 2. Have BV accumulated in their tree (leftBV > 0 or rightBV > 0)
 * 
 * Run after stress test to calculate all pending matching bonuses
 */

require('dotenv').config();
const prisma = require('../src/prismaClient');
const { processMatchingBonus, LockBusyError } = require('../src/services/commissionService');

// NOTE: the selection filter below is still wrong and will be replaced in Phase 2
// by a proper sweep service. It filters on BV (over-selects: harmless) and on
// hasPurchased (under-selects: CAN SKIP USERS WHO ARE OWED MONEY, because
// processMatchingBonus does not require hasPurchased). Do not treat this script
// as a complete reconciliation.

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

                const result = await processMatchingBonus(user.id);

                // `amount`, not `bonus`: the return value is a PairPayoutRecord.
                // The old check on result.bonus was always undefined, so this
                // script always reported ₹0 even when it had paid out correctly.
                if (result && result.amount > 0) {
                    console.log(`  ✓ Matching bonus: ₹${result.amount} (${result.pairs} pairs)`);
                    totalPayout += result.amount;
                } else {
                    console.log('  - No matching bonus owed');
                }

                processed++;
            } catch (err) {
                if (err instanceof LockBusyError) {
                    // The live worker is already paying this user; skip, don't retry.
                    console.log('  - Skipped (locked by another payout)');
                } else {
                    console.error(`  ✗ Error: ${err.message}`);
                    failed++;
                }
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
