const test = require('node:test');
const assert = require('node:assert/strict');
const { prisma, makeUser, snapshot, resetDb } = require('./helpers');
const { processMatchingBonus } = require('../../src/services/commissionService');

const RATE = parseInt(process.env.MATCHING_BONUS_PER_MATCH || '700', 10);
const LEAD_PCT = parseInt(process.env.LEADERSHIP_BONUS_PERCENT || '10', 10);

test.after(async () => { await prisma.$disconnect(); });

test('happy path: 5L/3R pays 3 pairs and carries 2L/0R', async () => {
    await resetDb();
    const user = await makeUser({ left: 5, right: 3 });

    const payout = await processMatchingBonus(user.id);
    assert.ok(payout, 'a payout was made');
    assert.equal(payout.pairs, 3);
    assert.equal(payout.amount, 3 * RATE);
    assert.equal(payout.leftConsumed, 3);
    assert.equal(payout.rightConsumed, 3);
    assert.equal(payout.membersConsumed, 6);
    assert.equal(payout.matchType, '1:1');

    const s = await snapshot(user.id);
    assert.equal(s.balance, 3 * RATE, 'wallet credited');
    assert.equal(s.leftCarryCount, 2);
    assert.equal(s.rightCarryCount, 0);
    assert.equal(s.leftMemberCount, 0);
    assert.equal(s.rightMemberCount, 0);
    assert.equal(s.counterPairs, 3);
    assert.equal(s.totalPairs, 3);
    assert.equal(s.txnCount, 1, 'one MATCHING_BONUS transaction');
});

test('equal legs apply the tail rule: 4L/4R pays 3, not 4', async () => {
    await resetDb();
    const user = await makeUser({ left: 4, right: 4 });
    const payout = await processMatchingBonus(user.id);
    assert.equal(payout.pairs, 3, 'tail member must remain');

    const s = await snapshot(user.id);
    assert.equal(s.leftCarryCount, 1);
    assert.equal(s.rightCarryCount, 1);
});

test('eligibility gate: fewer than 2 direct referrals pays nothing', async () => {
    await resetDb();
    const user = await makeUser({ left: 5, right: 5, directs: 1 });

    const payout = await processMatchingBonus(user.id);
    assert.equal(payout, null);

    const s = await snapshot(user.id);
    assert.equal(s.balance, 0);
    assert.equal(s.payoutCount, 0);
    assert.equal(s.leftMemberCount, 5, 'counts untouched — nothing is lost');
    assert.equal(s.rightMemberCount, 5);
});

test('carry-forward is preserved and reused on the next run', async () => {
    await resetDb();
    const user = await makeUser({ left: 5, right: 1 });

    const first = await processMatchingBonus(user.id);
    assert.equal(first.pairs, 1);
    let s = await snapshot(user.id);
    assert.equal(s.leftCarryCount, 4);
    assert.equal(s.rightCarryCount, 0);

    // Two more members arrive on the right, as a purchase would do.
    await prisma.user.update({
        where: { id: user.id },
        data: { rightMemberCount: { increment: 2 } }
    });

    // leftTotal = 0 + 4 = 4, rightTotal = 2 + 0 = 2 -> 2 more pairs
    const second = await processMatchingBonus(user.id);
    assert.equal(second.pairs, 2, 'carried-forward left members were reused');

    s = await snapshot(user.id);
    assert.equal(s.payoutCount, 2);
    assert.equal(s.totalPairs, 3);
    assert.equal(s.balance, 3 * RATE);
    // This is the regression guard for the P2002->upsert change: the second
    // payout must take the counter's UPDATE branch inside a real transaction.
    assert.equal(s.counterRows, 1, 'one counter row for the day');
    assert.equal(s.counterPairs, 3, 'counter incremented, not duplicated');
});

test('daily pair cap is enforced and the remainder carries', async () => {
    await resetDb();
    const user = await makeUser({ left: 5, right: 3 });

    const payout = await processMatchingBonus(user.id, { dailyPairCap: 2 });
    assert.equal(payout.pairs, 2, 'capped at 2');

    let s = await snapshot(user.id);
    assert.equal(s.leftCarryCount, 3);
    assert.equal(s.rightCarryCount, 1);
    assert.equal(s.counterPairs, 2);

    // Same day, cap already consumed -> nothing more
    const again = await processMatchingBonus(user.id, { dailyPairCap: 2 });
    assert.equal(again, null);

    s = await snapshot(user.id);
    assert.equal(s.payoutCount, 1);
    assert.equal(s.balance, 2 * RATE);
});

test('leadership bonus credits the sponsor a percentage of matching income', async () => {
    await resetDb();
    const sponsor = await makeUser({ directs: 0 });
    const user = await makeUser({ left: 5, right: 3, sponsorId: sponsor.id });

    const payout = await processMatchingBonus(user.id);
    const expectedLead = Math.floor((payout.amount * LEAD_PCT) / 100);

    const sponsorWallet = await prisma.wallet.findUnique({ where: { userId: sponsor.id } });
    assert.equal(sponsorWallet.balance, expectedLead);

    const leadTxns = await prisma.transaction.findMany({
        where: { userId: sponsor.id, type: 'LEADERSHIP_BONUS' }
    });
    assert.equal(leadTxns.length, 1);

    const counters = await prisma.dailyLeadershipCounter.findMany({ where: { userId: sponsor.id } });
    assert.equal(counters.length, 1);
    assert.equal(counters[0].amount, expectedLead);
});

test('rank promotion writes a RankChange row', async () => {
    await resetDb();
    // 15 pairs promotes Rookie -> Associate Executive
    const user = await makeUser({ left: 20, right: 16, totalPairs: 0 });

    const payout = await processMatchingBonus(user.id, { dailyPairCap: 100 });
    assert.equal(payout.pairs, 16);

    const s = await snapshot(user.id);
    assert.equal(s.totalPairs, 16);
    assert.equal(s.rank, 'Associate Executive');
    assert.equal(s.rankChanges, 1);
});

test('a user with nothing owed is a clean no-op', async () => {
    await resetDb();
    const user = await makeUser({ left: 1, right: 1 }); // equal, tail rule -> 0 pairs
    const payout = await processMatchingBonus(user.id);
    assert.equal(payout, null);

    const s = await snapshot(user.id);
    assert.equal(s.payoutCount, 0);
    assert.equal(s.balance, 0);
    assert.equal(s.leftMemberCount, 1, 'counts untouched');
    assert.equal(s.rightMemberCount, 1);
});
