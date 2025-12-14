/**
 * Optimized 101 User Test - Uses direct DB operations for speed
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const fs = require('fs');

const { calculate2to1Matching, processMatchingBonus } = require('./src/services/commissionService');

const logFile = 'test_101_results.log';
let logs = [];
function log(msg) { logs.push(msg); console.log(msg); }
function saveLog() { fs.writeFileSync(logFile, logs.join('\n')); }

async function cleanup() {
    log('Cleaning test users...');
    await prisma.dailyPairCounter.deleteMany({ where: { user: { email: { startsWith: 'test_' } } } });
    await prisma.pairPayoutRecord.deleteMany({ where: { user: { email: { startsWith: 'test_' } } } });
    await prisma.transaction.deleteMany({ where: { user: { email: { startsWith: 'test_' } } } });
    await prisma.refreshToken.deleteMany({ where: { userId: { in: (await prisma.user.findMany({ where: { email: { startsWith: 'test_' } }, select: { id: true } })).map(u => u.id) } } });
    await prisma.wallet.deleteMany({ where: { user: { email: { startsWith: 'test_' } } } });
    await prisma.user.deleteMany({ where: { email: { startsWith: 'test_' } } });
    log('Cleanup done');
}

async function run() {
    log('='.repeat(60));
    log('101 USER TEST - OPTIMIZED');
    log('='.repeat(60));

    await cleanup();

    // Get and reset admin
    const admin = await prisma.user.findUnique({ where: { email: 'admin@gmail.com' } });
    if (!admin) throw new Error('Run npm run seed first');

    await prisma.user.update({
        where: { id: admin.id },
        data: { leftMemberCount: 0, rightMemberCount: 0, leftCarryCount: 0, rightCarryCount: 0, position: 'ROOT', parentId: null }
    });
    await prisma.transaction.deleteMany({ where: { userId: admin.id } });
    await prisma.pairPayoutRecord.deleteMany({ where: { userId: admin.id } });
    await prisma.wallet.updateMany({ where: { userId: admin.id }, data: { balance: 0 } });

    log(`Admin: ${admin.id}`);

    // Create users with direct placement (no tail search for speed)
    const password = await bcrypt.hash('Test@123', 10);
    const users = [];
    const sponsors = [admin.id];

    log('\nCreating 51 LEFT users...');
    let prevLeft = admin.id;
    for (let i = 1; i <= 51; i++) {
        const sponsorId = sponsors[Math.floor(Math.random() * sponsors.length)];
        const user = await prisma.user.create({
            data: {
                username: `test_l${i}`,
                email: `test_l${i}@test.com`,
                password,
                sponsorId,
                parentId: prevLeft,
                position: 'LEFT',
                isEmailVerified: true
            }
        });
        await prisma.wallet.create({ data: { userId: user.id } });
        users.push(user);
        sponsors.push(user.id);
        prevLeft = user.id;
        if (i % 20 === 0) log(`  ${i}/51`);
    }

    log('Creating 50 RIGHT users...');
    let prevRight = admin.id;
    for (let i = 1; i <= 50; i++) {
        const sponsorId = sponsors[Math.floor(Math.random() * sponsors.length)];
        const user = await prisma.user.create({
            data: {
                username: `test_r${i}`,
                email: `test_r${i}@test.com`,
                password,
                sponsorId,
                parentId: prevRight,
                position: 'RIGHT',
                isEmailVerified: true
            }
        });
        await prisma.wallet.create({ data: { userId: user.id } });
        users.push(user);
        sponsors.push(user.id);
        prevRight = user.id;
        if (i % 20 === 0) log(`  ${i}/50`);
    }

    log(`\nTotal: ${users.length} users`);

    // Set admin counts directly (since we didn't propagate for speed)
    await prisma.user.update({
        where: { id: admin.id },
        data: { leftMemberCount: 51, rightMemberCount: 50 }
    });

    // Verify
    log('\n--- VERIFICATION ---');
    const adminCheck = await prisma.user.findUnique({ where: { id: admin.id } });
    log(`Admin L=${adminCheck.leftMemberCount}, R=${adminCheck.rightMemberCount}`);

    const match = calculate2to1Matching(51, 50);
    log(`\nExpected Matches: ${match.totalMatches}`);
    log(`  2:1: ${match.twoOneMatches}, 1:2: ${match.oneTwoMatches}`);
    log(`  Carry: L=${match.carryLeft}, R=${match.carryRight}`);

    // Check sponsor distribution
    const adminRefs = users.filter(u => u.sponsorId === admin.id).length;
    log(`\nAdmin direct referrals: ${adminRefs}/${users.length}`);

    // Check sponsor != parent
    const diffCount = users.filter(u => u.sponsorId !== u.parentId).length;
    log(`Users with sponsor != parent: ${diffCount}`);

    // Process matching
    log('\n--- MATCHING BONUS ---');
    try {
        const payout = await processMatchingBonus(null, admin.id, 100);
        if (payout) {
            log(`Payout: ${payout.pairs} pairs, Rs.${payout.amount}`);
            log(`Type: ${payout.matchType}, Consumed: ${payout.membersConsumed}`);
        } else {
            log('No payout');
        }
    } catch (e) {
        log(`Error: ${e.message}`);
    }

    // Final state
    const final = await prisma.user.findUnique({ where: { id: admin.id }, include: { wallet: true } });
    log(`\nFinal: L=${final.leftMemberCount}, R=${final.rightMemberCount}`);
    log(`Carry: L=${final.leftCarryCount}, R=${final.rightCarryCount}`);
    log(`Wallet: Rs.${final.wallet?.balance || 0}`);

    // Verify carry
    if (final.leftCarryCount === match.carryLeft && final.rightCarryCount === match.carryRight) {
        log('\nPASS: Carry forward correct');
    } else {
        log('\nFAIL: Carry mismatch');
    }

    log('\n' + '='.repeat(60));
    log('TEST COMPLETE');
    log('='.repeat(60));

    saveLog();
}

run().catch(e => { log('FAIL: ' + e.message); saveLog(); }).finally(() => prisma.$disconnect());
