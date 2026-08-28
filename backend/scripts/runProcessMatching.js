require('dotenv').config();
const prisma = require('../src/prismaClient');
const { processMatchingBonus, LockBusyError } = require('../src/services/commissionService');

/**
 * Pay one user's pending matching bonus.
 *   node scripts/runProcessMatching.js <userId>
 *
 * Safe to run alongside the live worker: processMatchingBonus takes a row lock,
 * so whichever runs second finds the counts already consumed.
 */
async function run(userId) {
    try {
        const payout = await processMatchingBonus(userId);
        if (payout) {
            console.log(`Paid ${payout.pairs} pair(s), ₹${payout.amount} (record ${payout.id})`);
        } else {
            console.log('Nothing owed — no payout made.');
        }
    } catch (e) {
        if (e instanceof LockBusyError) {
            console.error('Another payout is in progress for this user. Try again shortly.');
            process.exitCode = 3;
        } else {
            console.error('Error running processMatchingBonus:', e.message);
            process.exitCode = 1;
        }
    } finally {
        await prisma.$disconnect();
    }
}

const userId = process.argv[2];
if (!userId) { console.error('Usage: node scripts/runProcessMatching.js <userId>'); process.exit(2); }
run(userId);
