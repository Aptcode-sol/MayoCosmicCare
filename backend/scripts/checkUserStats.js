/**
 * Check User Stats - Debug Script
 * Shows member counts, BV, and carry values for a user
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    try {
        // Get Sanket's stats
        const sanket = await prisma.user.findFirst({
            where: { email: 'sanket@gmail.com' },
            select: {
                id: true,
                username: true,
                email: true,
                leftMemberCount: true,
                rightMemberCount: true,
                leftCarryCount: true,
                rightCarryCount: true,
                leftBV: true,
                rightBV: true,
                leftCarryBV: true,
                rightCarryBV: true
            }
        });

        if (!sanket) {
            console.log('Sanket not found');
            return;
        }

        console.log('\n╔══════════════════════════════════════════════════════╗');
        console.log('║                  SANKET STATS                        ║');
        console.log('╚══════════════════════════════════════════════════════╝\n');
        console.log(`User: ${sanket.username} (${sanket.email})`);
        console.log(`ID: ${sanket.id}\n`);

        console.log('MEMBER COUNTS:');
        console.log(`  Left Members:  ${sanket.leftMemberCount} (Carry: ${sanket.leftCarryCount})`);
        console.log(`  Right Members: ${sanket.rightMemberCount} (Carry: ${sanket.rightCarryCount})`);
        console.log(`  Total: ${sanket.leftMemberCount + sanket.rightMemberCount}\n`);

        console.log('BUSINESS VOLUME:');
        console.log(`  Left BV:  ₹${sanket.leftBV.toLocaleString()} (Carry: ₹${sanket.leftCarryBV})`);
        console.log(`  Right BV: ₹${sanket.rightBV.toLocaleString()} (Carry: ₹${sanket.rightCarryBV})`);
        console.log(`  Total BV: ₹${(sanket.leftBV + sanket.rightBV).toLocaleString()}\n`);

        // Calculate potential matching bonus
        const leftTotal = sanket.leftMemberCount + sanket.leftCarryCount;
        const rightTotal = sanket.rightMemberCount + sanket.rightCarryCount;
        const minSide = Math.min(leftTotal, rightTotal);
        const pairs = Math.floor(minSide / 3);

        console.log('MATCHING BONUS CALCULATION:');
        console.log(`  Left Total: ${leftTotal}`);
        console.log(`  Right Total: ${rightTotal}`);
        console.log(`  Potential Pairs (2:1): ${pairs}`);
        console.log(`  Bonus @ ₹700/pair: ₹${pairs * 700}\n`);

        // Get direct referrals count
        const directReferrals = await prisma.user.count({
            where: { sponsorId: sanket.id }
        });

        console.log('REFERRALS:');
        console.log(`  Direct Referrals: ${directReferrals}\n`);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

run();
