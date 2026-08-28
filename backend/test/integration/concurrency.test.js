const test = require('node:test');
const assert = require('node:assert/strict');
const { prisma, makeUser, snapshot, resetDb } = require('./helpers');
const { processMatchingBonus, LockBusyError } = require('../../src/services/commissionService');

const RATE = parseInt(process.env.MATCHING_BONUS_PER_MATCH || '700', 10);

/**
 * THE test for this change.
 *
 * Before the fix, processMatchingBonus took a Prisma client, every caller passed
 * the root client, and the `db.$transaction(...)` branch was therefore dead code.
 * That made pg_advisory_xact_lock a no-op (a transaction-scoped lock outside a
 * transaction), so N concurrent invocations all read the same member counts and
 * all paid out.
 *
 * With two PM2 cluster workers at concurrency 5, ten concurrent payouts for one
 * user was a reachable state in production.
 */

test.before(async () => { await resetDb(); });
test.after(async () => { await prisma.$disconnect(); });

test('10 concurrent payouts produce exactly one payout', async () => {
    await resetDb();
    const user = await makeUser({ left: 5, right: 3, directs: 2 });

    const results = await Promise.all(
        Array.from({ length: 10 }, () => processMatchingBonus(user.id).catch((e) => e))
    );

    const paid = results.filter((r) => r && !(r instanceof Error) && r.amount);
    const lockBusy = results.filter((r) => r instanceof LockBusyError);
    const nulls = results.filter((r) => r === null);
    const unexpected = results.filter(
        (r) => r instanceof Error && !(r instanceof LockBusyError)
    );

    assert.deepEqual(unexpected.map((e) => e.message), [], 'no unexpected errors');
    assert.equal(paid.length, 1, `exactly one payout (got ${paid.length})`);
    assert.equal(paid.length + lockBusy.length + nulls.length, 10, 'every call accounted for');

    // min(5,3) = 3 pairs
    const s = await snapshot(user.id);
    assert.equal(s.payoutCount, 1, 'exactly one PairPayoutRecord');
    assert.equal(s.payoutPairs, 3, '3 pairs');
    assert.equal(s.balance, 3 * RATE, 'wallet credited exactly once');
    assert.equal(s.payoutAmount, 3 * RATE);
    assert.equal(s.counterPairs, 3, 'daily counter incremented exactly once');
    assert.equal(s.counterRows, 1, 'exactly one DailyPairCounter row');
    assert.equal(s.totalPairs, 3, 'totalPairs incremented exactly once');

    // 5L/3R -> 3 pairs -> carry 2L/0R
    assert.equal(s.leftMemberCount, 0);
    assert.equal(s.rightMemberCount, 0);
    assert.equal(s.leftCarryCount, 2);
    assert.equal(s.rightCarryCount, 0);
});

test('concurrent payouts across different users do not block each other', async () => {
    await resetDb();
    const users = await Promise.all([
        makeUser({ left: 3, right: 2 }),
        makeUser({ left: 4, right: 4 }),
        makeUser({ left: 2, right: 6 })
    ]);

    const results = await Promise.all(users.map((u) => processMatchingBonus(u.id)));

    // 3L/2R -> 2 ; 4L/4R -> 3 (equal legs, tail rule) ; 2L/6R -> 2
    assert.deepEqual(results.map((r) => r.pairs), [2, 3, 2]);
    for (const u of users) {
        const s = await snapshot(u.id);
        assert.equal(s.payoutCount, 1);
    }
});

test('a second payout in the same window pays nothing more', async () => {
    await resetDb();
    const user = await makeUser({ left: 5, right: 3 });

    const first = await processMatchingBonus(user.id);
    assert.equal(first.pairs, 3);

    const second = await processMatchingBonus(user.id);
    assert.equal(second, null, 'nothing left to pay');

    const s = await snapshot(user.id);
    assert.equal(s.payoutCount, 1);
    assert.equal(s.balance, 3 * RATE);
});
