/**
 * Debug Matching Bonus Processing
 * Shows detailed step-by-step what happens during matching calculation
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function calculate2to1Matching(leftCount, rightCount) {
    let left = leftCount;
    let right = rightCount;
    let twoOneMatches = 0;
    let oneTwoMatches = 0;

    while ((left >= 2 && right >= 1) || (left >= 1 && right >= 2)) {
        const canDoTwoOne = left >= 2 && right >= 1;
        const canDoOneTwo = left >= 1 && right >= 2;

        if (canDoTwoOne && canDoOneTwo) {
            if (left > right * 2) {
                twoOneMatches++; left -= 2; right -= 1;
            } else if (right > left * 2) {
                oneTwoMatches++; left -= 1; right -= 2;
            } else {
                twoOneMatches++; left -= 2; right -= 1;
            }
        } else if (canDoTwoOne) {
            twoOneMatches++; left -= 2; right -= 1;
        } else if (canDoOneTwo) {
            oneTwoMatches++; left -= 1; right -= 2;
        } else {
            break;
        }
    }

    const totalMatches = twoOneMatches + oneTwoMatches;
    const leftConsumed = (twoOneMatches * 2) + (oneTwoMatches * 1);
    const rightConsumed = (twoOneMatches * 1) + (oneTwoMatches * 2);

    return {
        twoOneMatches, oneTwoMatches, totalMatches,
        membersConsumed: totalMatches * 3,
        leftConsumed, rightConsumed,
        carryLeft: left, carryRight: right
    };
}

async function run() {
    try {
        const sanket = await prisma.user.findFirst({
            where: { email: 'sanket@gmail.com' }
        });

        if (!sanket) {
            console.log('Sanket not found');
            return;
        }

        console.log('\n╔══════════════════════════════════════════════════════╗');
        console.log('║         DEBUG MATCHING BONUS CALCULATION              ║');
        console.log('╚══════════════════════════════════════════════════════╝\n');

        console.log(`User: ${sanket.username} (${sanket.email})`);
        console.log(`ID: ${sanket.id}\n`);

        // Step 1: Get current counts
        const leftTotal = (sanket.leftMemberCount || 0) + (sanket.leftCarryCount || 0);
        const rightTotal = (sanket.rightMemberCount || 0) + (sanket.rightCarryCount || 0);

        console.log('STEP 1: Current Member Counts');
        console.log(`  leftMemberCount: ${sanket.leftMemberCount}`);
        console.log(`  leftCarryCount: ${sanket.leftCarryCount}`);
        console.log(`  rightMemberCount: ${sanket.rightMemberCount}`);
        console.log(`  rightCarryCount: ${sanket.rightCarryCount}`);
        console.log(`  Left Total: ${leftTotal}`);
        console.log(`  Right Total: ${rightTotal}\n`);

        // Step 2: Check if both sides have members
        if (leftTotal <= 0 || rightTotal <= 0) {
            console.log('❌ EARLY EXIT: One or both sides have 0 members\n');
            return;
        }

        // Step 3: Check daily cap
        const bonusPerMatch = parseInt(process.env.MATCHING_BONUS_PER_MATCH || '700', 10);
        const cap = parseInt(process.env.DAILY_PAIR_CAP || '10', 10);

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

        let counter = await prisma.dailyPairCounter.findFirst({
            where: {
                userId: sanket.id,
                date: { gte: todayStart, lt: todayEnd }
            }
        });

        const pairsToday = counter?.pairs || 0;
        const remaining = Math.max(0, cap - pairsToday);

        console.log('STEP 2: Daily Cap Check');
        console.log(`  Daily cap: ${cap} pairs`);
        console.log(`  Pairs processed today: ${pairsToday}`);
        console.log(`  Remaining capacity: ${remaining}\n`);

        if (remaining <= 0) {
            console.log('❌ EARLY EXIT: Daily pair cap reached\n');
            return;
        }

        // Step 4: Calculate matching
        const result = calculate2to1Matching(leftTotal, rightTotal);

        console.log('STEP 3: Matching Calculation');
        console.log(`  2:1 matches: ${result.twoOneMatches}`);
        console.log(`  1:2 matches: ${result.oneTwoMatches}`);
        console.log(`  Total matches: ${result.totalMatches}`);
        console.log(`  Members consumed: ${result.membersConsumed} (Left: ${result.leftConsumed}, Right: ${result.rightConsumed})`);
        console.log(`  Carry forward: Left ${result.carryLeft}, Right ${result.carryRight}\n`);

        if (result.totalMatches <= 0) {
            console.log('❌ EARLY EXIT: No matches possible\n');
            return;
        }

        // Step 5: Apply cap
        const matchesToPay = Math.min(result.totalMatches, remaining);
        const bonus = matchesToPay * bonusPerMatch;

        console.log('STEP 4: Bonus Calculation');
        console.log(`  Matches to pay: ${matchesToPay} (capped by remaining: ${remaining})`);
        console.log(`  Bonus per match: ₹${bonusPerMatch}`);
        console.log(`  Total bonus: ₹${bonus}\n`);

        console.log('✅ Matching bonus SHOULD be processed!\n');
        console.log('To actually process, run:');
        console.log(`  node scripts/runProcessMatching.js ${sanket.id}\n`);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

run();
