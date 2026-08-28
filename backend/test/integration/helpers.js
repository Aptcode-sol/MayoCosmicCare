/**
 * Fixtures for integration tests. Requires a REAL Postgres — see test/integration/README.md.
 * Refuses to run against anything that doesn't look like a throwaway database.
 */
const assert = require('node:assert/strict');

const url = process.env.DATABASE_URL || '';
if (!/mlm_test|_test|localhost|127\.0\.0\.1/.test(url)) {
    throw new Error(
        `Refusing to run integration tests against DATABASE_URL=${url.replace(/:[^:@]*@/, ':***@')}. ` +
        `Point it at a throwaway local database.`
    );
}

const prisma = require('../../src/prismaClient');

let seq = 0;
function uid(prefix) { return `${prefix}_${process.pid}_${Date.now()}_${seq++}`; }

/**
 * Create a user with the member counts the matching engine actually reads,
 * plus `directs` direct referrals (the eligibility gate needs >= 2).
 */
async function makeUser({
    left = 0, right = 0, carryLeft = 0, carryRight = 0,
    directs = 2, sponsorId = null, totalPairs = 0, rank = 'Rookie', balance = 0
} = {}) {
    const id = uid('u');
    const user = await prisma.user.create({
        data: {
            id,
            username: uid('n'),
            email: `${id}@test.local`,
            password: 'x',
            sponsorId,
            leftMemberCount: left,
            rightMemberCount: right,
            leftCarryCount: carryLeft,
            rightCarryCount: carryRight,
            totalPairs,
            rank,
            hasPurchased: true
        }
    });
    await prisma.wallet.create({ data: { userId: id, balance } });

    for (let i = 0; i < directs; i++) {
        const rid = uid('r');
        await prisma.user.create({
            data: {
                id: rid,
                username: uid('rn'),
                email: `${rid}@test.local`,
                password: 'x',
                sponsorId: id,
                hasPurchased: true
            }
        });
    }
    return user;
}

async function walletBalance(userId) {
    const w = await prisma.wallet.findUnique({ where: { userId } });
    return w?.balance ?? 0;
}

async function snapshot(userId) {
    const [user, wallet, payouts, txns, counters, ranks] = await Promise.all([
        prisma.user.findUnique({ where: { id: userId } }),
        prisma.wallet.findUnique({ where: { userId } }),
        prisma.pairPayoutRecord.findMany({ where: { userId } }),
        prisma.transaction.findMany({ where: { userId } }),
        prisma.dailyPairCounter.findMany({ where: { userId } }),
        prisma.rankChange.findMany({ where: { userId } })
    ]);
    return {
        leftMemberCount: user.leftMemberCount, rightMemberCount: user.rightMemberCount,
        leftCarryCount: user.leftCarryCount, rightCarryCount: user.rightCarryCount,
        totalPairs: user.totalPairs, rank: user.rank,
        balance: wallet?.balance ?? 0,
        payoutCount: payouts.length,
        payoutPairs: payouts.reduce((s, p) => s + p.pairs, 0),
        payoutAmount: payouts.reduce((s, p) => s + p.amount, 0),
        txnCount: txns.length,
        counterPairs: counters.reduce((s, c) => s + c.pairs, 0),
        counterRows: counters.length,
        rankChanges: ranks.length
    };
}

/** Wipe everything. Safe because the URL guard above restricts us to a test DB. */
async function resetDb() {
    await prisma.$executeRawUnsafe(`
        TRUNCATE TABLE "RankChange", "PairPayoutRecord", "DailyPairCounter",
                       "DailyLeadershipCounter", "Transaction", "Wallet",
                       "OrderItem", "Order", "Withdrawal", "RefreshToken", "User"
        RESTART IDENTITY CASCADE
    `);
}

module.exports = { prisma, makeUser, walletBalance, snapshot, resetDb, uid, assert };
