const prisma = require('../prismaClient');
// Pure helpers live in matchingMath.js so they can be unit-tested without a DB.
// Keep them there — do not re-inline this logic.
const { calculate1to1TailMatching, rankForPairs, istDayBounds } = require('./matchingMath');

/**
 * Transaction settings for a payout.
 *
 * The payout issues ~13 sequential statements, plus ~6 more in the leadership
 * bonus, plus the lock wait — well past Prisma's 5s default timeout.
 */
const MATCHING_TX = {
    maxWait: Number(process.env.MATCHING_TX_MAXWAIT_MS || 15000),
    timeout: Number(process.env.MATCHING_TX_TIMEOUT_MS || 30000)
};

/** Bounded lock wait, so contention becomes a clean retryable error, not a stuck pool connection. */
const LOCK_TIMEOUT_MS = Math.max(100, Math.trunc(Number(process.env.MATCHING_LOCK_TIMEOUT_MS || 4000)));

/** Thrown when another payout holds this user's row. Retryable — nothing has been written. */
class LockBusyError extends Error {
    constructor(userId) {
        super(`matching: row lock busy for ${userId}`);
        this.name = 'LockBusyError';
        this.code = 'LOCK_BUSY';
    }
}

function isLockTimeout(err) {
    const m = String(err?.message || '');
    return m.includes('55P03') || /lock timeout|canceling statement due to lock/i.test(m);
}

/**
 * Reject the root PrismaClient where an interactive transaction client is required.
 *
 * This guard is the structural fix for the original bug: `processMatchingBonus`
 * used to take a client and branch on whether one was passed, so handing it the
 * root client (which every caller did) silently skipped the transaction AND
 * turned pg_advisory_xact_lock into a no-op. The two cases were indistinguishable
 * at runtime. A TransactionClient has no $transaction method; the root client does.
 */
function assertTxClient(tx, fnName) {
    if (tx && typeof tx.$transaction === 'function') {
        throw new TypeError(
            `${fnName}: expected an interactive transaction client, got the root PrismaClient. ` +
            `Call it without a tx to let it open its own transaction.`
        );
    }
}

/**
 * Credit leadership bonus to a sponsor when their referral earns matching income.
 * Transaction-only: always called from inside the payout transaction.
 */
async function creditLeadershipBonusInTx(tx, sponsorId, referralEarning, referralId) {
    assertTxClient(tx, 'creditLeadershipBonusInTx');
    if (!tx || !sponsorId || referralEarning <= 0) return null;

    const percent = parseInt(process.env.LEADERSHIP_BONUS_PERCENT || '10', 10);
    const dailyCap = parseInt(process.env.DAILY_LEADERSHIP_BONUS_CAP || '5000', 10);

    const bonusAmount = Math.floor((referralEarning * percent) / 100);
    if (bonusAmount <= 0) return null;

    const { todayStart } = istDayBounds();

    const counter = await tx.dailyLeadershipCounter.findUnique({
        where: { userId_date: { userId: sponsorId, date: todayStart } }
    });

    const earnedToday = counter?.amount || 0;
    const remaining = Math.max(0, dailyCap - earnedToday);
    if (remaining <= 0) return null;

    const actualBonus = Math.min(bonusAmount, remaining);

    await tx.wallet.upsert({
        where: { userId: sponsorId },
        update: { balance: { increment: actualBonus } },
        create: { userId: sponsorId, balance: actualBonus }
    });

    let referralLabel = null;
    if (referralId) {
        const referral = await tx.user.findUnique({
            where: { id: referralId },
            select: { name: true, username: true, email: true }
        });
        referralLabel = referral?.name || referral?.username || referral?.email || null;
    }

    await tx.transaction.create({
        data: {
            userId: sponsorId,
            type: 'LEADERSHIP_BONUS',
            amount: actualBonus,
            detail: referralLabel
                ? `Leadership bonus from ${referralLabel} (${percent}% of referral earnings)`
                : `Leadership bonus (${percent}% of referral earnings)`
        }
    });

    // upsert, NOT create-then-catch-P2002. In Postgres a failed statement aborts
    // the enclosing transaction, so the old fallback UPDATE would itself fail with
    // "current transaction is aborted" and roll back the entire payout. The old
    // form only worked because nothing here was transactional.
    await tx.dailyLeadershipCounter.upsert({
        where: { userId_date: { userId: sponsorId, date: todayStart } },
        update: { amount: { increment: actualBonus } },
        create: { userId: sponsorId, date: todayStart, amount: actualBonus }
    });

    return { sponsorId, amount: actualBonus };
}

/**
 * Credit a direct referral bonus. Transaction-only variant.
 * Called from purchaseService inside the purchase transaction.
 */
async function creditDirectBonusInTx(tx, sponsorId, bv, referralId = null) {
    assertTxClient(tx, 'creditDirectBonusInTx');
    const bonusAmount = parseInt(process.env.DIRECT_BONUS_AMOUNT || '500', 10);

    let referralLabel = null;
    if (referralId) {
        const referral = await tx.user.findUnique({
            where: { id: referralId },
            select: { name: true, username: true, email: true }
        });
        referralLabel = referral?.name || referral?.username || referral?.email || null;
    }

    const detail = referralLabel
        ? `Direct bonus from ${referralLabel} (BV ${bv})`
        : `Direct bonus for referral (BV ${bv})`;

    await tx.transaction.create({
        data: { userId: sponsorId, type: 'DIRECT_BONUS', amount: bonusAmount, detail }
    });
    await tx.wallet.upsert({
        where: { userId: sponsorId },
        update: { balance: { increment: bonusAmount } },
        create: { userId: sponsorId, balance: bonusAmount }
    });

    return { sponsorId, amount: bonusAmount };
}

/** Standalone direct bonus (admin/repair use). Owns its own transaction. */
async function creditDirectBonus(sponsorId, bv, referralId = null) {
    return prisma.$transaction(
        (tx) => creditDirectBonusInTx(tx, sponsorId, bv, referralId),
        MATCHING_TX
    );
}

/**
 * The payout itself. Always runs inside a transaction, always under a row lock.
 */
async function runMatchingInTx(tx, userId, dailyPairCap) {
    const bonusPerMatch = parseInt(process.env.MATCHING_BONUS_PER_MATCH || '700', 10);
    const cap = dailyPairCap === null || dailyPairCap === undefined
        ? parseInt(process.env.DAILY_PAIR_CAP || '10', 10)
        : dailyPairCap;

    // Bound the lock wait so contention surfaces as a retryable error instead of
    // pinning a pool connection for the full transaction timeout.
    await tx.$executeRawUnsafe(`SET LOCAL lock_timeout = '${LOCK_TIMEOUT_MS}ms'`);

    // Lock the row we are about to mutate.
    //
    // This replaces pg_advisory_xact_lock, which was broken three ways: it ran
    // outside any transaction (so it released immediately), it was wrapped in an
    // empty catch, and it passed a BigInt as an untyped bound parameter to an
    // overloaded function — (bigint) vs (int,int) — so it could fail overload
    // resolution outright. FOR UPDATE has no typing problem, shares no key space
    // with placementService's advisory locks, and locks the actual resource.
    let rows;
    try {
        rows = await tx.$queryRawUnsafe('SELECT id FROM "User" WHERE id = $1 FOR UPDATE', userId);
    } catch (err) {
        if (isLockTimeout(err)) throw new LockBusyError(userId);
        throw err;
    }
    if (!rows.length) return null;

    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) return null;

    // Eligibility gate: user must have at least 2 direct referrals
    const directReferralCount = await tx.user.count({ where: { sponsorId: userId } });
    if (directReferralCount < 2) return null;

    const leftTotal = (user.leftMemberCount || 0) + (user.leftCarryCount || 0);
    const rightTotal = (user.rightMemberCount || 0) + (user.rightCarryCount || 0);
    if (leftTotal <= 0 || rightTotal <= 0) return null;

    // Start of today, IST (see matchingMath.istDayBounds — TZ-independent)
    const { todayStart } = istDayBounds();

    const counter = await tx.dailyPairCounter.findUnique({
        where: { userId_date: { userId, date: todayStart } }
    });
    const pairsToday = counter?.pairs || 0;
    const remaining = Math.max(0, cap - pairsToday);
    if (remaining <= 0) return null;

    const result = calculate1to1TailMatching(leftTotal, rightTotal);
    if (result.totalMatches <= 0) return null;

    const matchesToPay = Math.min(result.totalMatches, remaining);
    // Recalculate carry when capped
    const actualLeftConsumed = matchesToPay;
    const actualRightConsumed = matchesToPay;
    const carryLeft = leftTotal - actualLeftConsumed;
    const carryRight = rightTotal - actualRightConsumed;
    const membersConsumed = matchesToPay * 2;
    const bonus = matchesToPay * bonusPerMatch;

    // Consume the matched members. Safe as an absolute write because we hold the
    // row lock: any concurrent purchase incrementing these counts must wait.
    await tx.user.update({
        where: { id: userId },
        data: {
            leftMemberCount: 0, rightMemberCount: 0,
            leftCarryCount: carryLeft, rightCarryCount: carryRight
        }
    });

    await tx.wallet.upsert({
        where: { userId },
        update: { balance: { increment: bonus } },
        create: { userId, balance: bonus }
    });

    const payout = await tx.pairPayoutRecord.create({
        data: {
            userId, date: todayStart, pairs: matchesToPay, amount: bonus,
            matchType: '1:1', membersConsumed,
            leftConsumed: actualLeftConsumed,
            rightConsumed: actualRightConsumed
        }
    });

    await tx.transaction.create({
        data: { userId, type: 'MATCHING_BONUS', amount: bonus, detail: `Matching bonus: ${matchesToPay} pairs (1:1)` }
    });

    await tx.dailyPairCounter.upsert({
        where: { userId_date: { userId, date: todayStart } },
        update: { pairs: { increment: matchesToPay } },
        create: { userId, date: todayStart, pairs: matchesToPay }
    });

    // --- Rank ---
    const newTotalPairs = (user.totalPairs || 0) + matchesToPay;
    const newRank = rankForPairs(newTotalPairs);

    const updateData = { totalPairs: { increment: matchesToPay } };
    if (newRank !== user.rank) {
        updateData.rank = newRank;
        await tx.rankChange.create({
            data: {
                userId,
                fromRank: user.rank || 'None',
                toRank: newRank,
                pairsAtChange: newTotalPairs
            }
        });
    }

    await tx.user.update({ where: { id: userId }, data: updateData });

    // Leadership bonus for this user's sponsor, in the same transaction.
    if (user.sponsorId && bonus > 0) {
        await creditLeadershipBonusInTx(tx, user.sponsorId, bonus, userId);
    }

    return payout;
}

/**
 * Pay a user's matching bonus.
 *
 * @param {string} userId
 * @param {{ dailyPairCap?: number|null, tx?: import('@prisma/client').Prisma.TransactionClient }} [opts]
 * @returns {Promise<object|null>} the PairPayoutRecord, or null if nothing was owed
 * @throws {LockBusyError} when another payout holds the row — safe to retry
 *
 * Pass opts.tx ONLY from inside an existing transaction. Never call this without
 * opts.tx from within another transaction that has already touched this user's
 * row: it would open a second connection and block on its own uncommitted write
 * (lock_timeout turns that hang into a 4s error rather than a deadlock).
 */
async function processMatchingBonus(userId, opts = {}) {
    if (typeof userId !== 'string' || !userId) {
        throw new TypeError(
            `processMatchingBonus: expected a userId string, got ${typeof userId}. ` +
            `The signature changed — it no longer takes a Prisma client as the first argument.`
        );
    }

    const { dailyPairCap = null, tx = null } = opts;

    if (tx) {
        assertTxClient(tx, 'processMatchingBonus');
        return runMatchingInTx(tx, userId, dailyPairCap);
    }

    return prisma.$transaction(
        (t) => runMatchingInTx(t, userId, dailyPairCap),
        MATCHING_TX
    );
}

module.exports = {
    processMatchingBonus,
    creditDirectBonus,
    creditDirectBonusInTx,
    creditLeadershipBonusInTx,
    calculate1to1TailMatching,
    LockBusyError,
    MATCHING_TX
};
