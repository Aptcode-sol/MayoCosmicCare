const test = require('node:test');
const assert = require('node:assert/strict');
const { prisma, makeUser, snapshot, resetDb } = require('./helpers');
const { processMatchingBonus } = require('../../src/services/commissionService');

const RATE = parseInt(process.env.MATCHING_BONUS_PER_MATCH || '700', 10);

/**
 * Proves the payout is genuinely ATOMIC, not merely locked.
 *
 * The payout writes to six tables. Before the fix none of it was transactional,
 * so a failure partway through left the wallet credited with no payout record,
 * or counts consumed with no payment — silent, permanent corruption.
 *
 * We inject a failure after the wallet has been credited and assert that
 * everything rolls back.
 */

// Injected via Prisma middleware. Flag-gated so it only affects the one test.
let failOn = null;
prisma.$use(async (params, next) => {
    if (failOn && params.model === failOn.model && params.action === failOn.action) {
        throw new Error(`injected failure: ${failOn.model}.${failOn.action}`);
    }
    return next(params);
});

test.after(async () => { failOn = null; await prisma.$disconnect(); });

test('a failure after the wallet credit rolls the whole payout back', async () => {
    await resetDb();
    const user = await makeUser({ left: 5, right: 3, balance: 500 });

    const before = await snapshot(user.id);
    assert.equal(before.balance, 500);

    // PairPayoutRecord.create runs AFTER wallet.upsert, so this proves the
    // already-applied wallet credit is undone.
    failOn = { model: 'PairPayoutRecord', action: 'create' };
    await assert.rejects(
        () => processMatchingBonus(user.id),
        /injected failure/,
        'the payout should surface the error, not swallow it'
    );
    failOn = null;

    const after = await snapshot(user.id);
    assert.equal(after.balance, 500, 'wallet credit rolled back');
    assert.equal(after.payoutCount, 0, 'no payout record');
    assert.equal(after.txnCount, 0, 'no transaction row');
    assert.equal(after.counterRows, 0, 'no daily counter row');
    assert.equal(after.totalPairs, 0, 'totalPairs unchanged');
    assert.equal(after.leftMemberCount, 5, 'member counts NOT consumed');
    assert.equal(after.rightMemberCount, 3);
    assert.equal(after.leftCarryCount, 0);
    assert.equal(after.rightCarryCount, 0);
});

test('a failure in the leadership bonus rolls back the whole matching payout', async () => {
    await resetDb();
    const sponsor = await makeUser({ directs: 0 });
    const user = await makeUser({ left: 5, right: 3, sponsorId: sponsor.id });

    // The leadership bonus is the LAST thing the payout does. If it fails, the
    // matching payout must not stand on its own.
    failOn = { model: 'DailyLeadershipCounter', action: 'upsert' };
    await assert.rejects(() => processMatchingBonus(user.id), /injected failure/);
    failOn = null;

    const s = await snapshot(user.id);
    assert.equal(s.balance, 0, 'matching bonus rolled back too');
    assert.equal(s.payoutCount, 0);
    assert.equal(s.leftMemberCount, 5, 'members still available to pay later');

    const sponsorWallet = await prisma.wallet.findUnique({ where: { userId: sponsor.id } });
    assert.equal(sponsorWallet.balance, 0, 'sponsor not credited');
});

test('after a rolled-back attempt, a retry pays correctly', async () => {
    await resetDb();
    const user = await makeUser({ left: 5, right: 3 });

    failOn = { model: 'PairPayoutRecord', action: 'create' };
    await assert.rejects(() => processMatchingBonus(user.id), /injected failure/);
    failOn = null;

    // Nothing was consumed, so the retry pays the full amount.
    const payout = await processMatchingBonus(user.id);
    assert.equal(payout.pairs, 3);

    const s = await snapshot(user.id);
    assert.equal(s.balance, 3 * RATE);
    assert.equal(s.payoutCount, 1);
    assert.equal(s.counterPairs, 3);
});

test('passing the root client is rejected loudly', async () => {
    await resetDb();
    const user = await makeUser({ left: 5, right: 3 });

    // The original bug: callers passed the root client and the code silently ran
    // unlocked and untransacted. That must now be impossible.
    await assert.rejects(
        () => processMatchingBonus(user.id, { tx: prisma }),
        /expected an interactive transaction client/
    );

    // And the old positional signature must not silently "work" either.
    await assert.rejects(
        () => processMatchingBonus(prisma, user.id),
        /expected a userId string/
    );

    const s = await snapshot(user.id);
    assert.equal(s.payoutCount, 0, 'no payout leaked through');
    assert.equal(s.balance, 0);
});
