const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Credit direct referral bonus to sponsor wallet.
 * This is a synchronous DB operation; in production do this via job queue.
 * tx param is optional Prisma transaction client.
 */
async function creditDirectBonus(txOrPrisma, sponsorId, bv) {
    const bonusAmount = 500; // or compute 5% of BV: Math.floor(bv * 0.05)
    const db = txOrPrisma || prisma;

    // create transaction record and update wallet
    await db.transaction.create({ data: { userId: sponsorId, type: 'DIRECT_BONUS', amount: bonusAmount, detail: `Direct bonus for referral (BV ${bv})` } });
    const wallet = await db.wallet.findUnique({ where: { userId: sponsorId } });
    if (wallet) {
        await db.wallet.update({ where: { userId: sponsorId }, data: { balance: wallet.balance + bonusAmount } });
    } else {
        await db.wallet.create({ data: { userId: sponsorId, balance: bonusAmount } });
    }

    // add audit log
    await db.auditLog.create({ data: { action: 'DIRECT_BONUS', actorId: sponsorId, meta: `amount:${bonusAmount},bv:${bv}` } });
}

module.exports = { creditDirectBonus };

/**
 * Attempt to match BV for a user: when leftBV and rightBV have common amount, form pairs
 * and credit matching bonus = 10% of matched BV. Applies daily cap on number of pairs.
 * Uses leftCarryBV and rightCarryBV for carry-forward logic.
 * This function expects a Prisma client (transaction or global).
 */
async function processMatchingBonus(db, userId, dailyPairCap = 10) {
    // load user BV including carry-forward
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) return;

    const left = (user.leftBV || 0) + (user.leftCarryBV || 0);
    const right = (user.rightBV || 0) + (user.rightCarryBV || 0);
    const possiblePairsBV = Math.min(left, right);
    if (possiblePairsBV <= 0) return;

    // pair unit size (BV per pair) — configurable; for example, 7000 BV per pair
    const pairUnitBV = 7000; // example unit; in production make configurable
    const maxPossiblePairs = Math.floor(possiblePairsBV / pairUnitBV);
    if (maxPossiblePairs <= 0) return;

    // load today's counter
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    let counter = await db.dailyPairCounter.findFirst({ where: { userId, date: today } });
    const alreadyToday = counter ? counter.pairs : 0;
    const availablePairsToday = Math.max(0, dailyPairCap - alreadyToday);
    const pairsToPay = Math.min(maxPossiblePairs, availablePairsToday);
    if (pairsToPay <= 0) return; // hit cap

    const matchedBV = pairsToPay * pairUnitBV;
    const bonus = Math.floor(matchedBV * 0.10);

    // create transaction for user
    await db.transaction.create({ data: { userId, type: 'MATCHING_BONUS', amount: bonus, detail: `Matching bonus for ${pairsToPay} pairs (${matchedBV} BV)` } });
    const wallet = await db.wallet.findUnique({ where: { userId } });
    if (wallet) {
        await db.wallet.update({ where: { userId }, data: { balance: wallet.balance + bonus } });
    } else {
        await db.wallet.create({ data: { userId, balance: bonus } });
    }

    // subtract matched BV from both legs and store remainder as carry-forward
    const newLeft = left - matchedBV;
    const newRight = right - matchedBV;

    await db.user.update({
        where: { id: userId },
        data: {
            leftBV: 0,
            rightBV: 0,
            leftCarryBV: newLeft,
            rightCarryBV: newRight
        }
    });

    // record payout
    const payout = await db.pairPayoutRecord.create({
        data: {
            userId,
            date: today,
            pairs: pairsToPay,
            amount: bonus
        }
    });

    // broadcast via SSE if available
    try {
        const { broadcastPayout } = require('../routes/sse');
        broadcastPayout(payout).catch?.(() => { });
    } catch (e) {
        // ignore if SSE not wired
    }

    // log payout
    try { const { info } = require('../logger'); info('pair-payout', { userId, payoutId: payout.id, amount: bonus }); } catch (e) { }

    // update daily counter
    if (counter) {
        await db.dailyPairCounter.update({ where: { id: counter.id }, data: { pairs: counter.pairs + pairsToPay } });
    } else {
        await db.dailyPairCounter.create({ data: { userId, date: today, pairs: pairsToPay } });
    }

    await db.auditLog.create({ data: { action: 'MATCHING_PAYOUT', actorId: userId, meta: `pairs:${pairsToPay},bv:${matchedBV},bonus:${bonus}` } });
}

module.exports = { creditDirectBonus, processMatchingBonus };
