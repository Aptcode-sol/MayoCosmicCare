const prisma = require('../prismaClient');
const crypto = require('crypto');

/**
 * Calculate 1:1 tail binary matching.
 * Pairs = min(left, right) - (left === right ? 1 : 0)
 * Requires an extra "tail" member on one side for matching to work.
 * Each pair consumes 1 from left + 1 from right = 2 members total.
 */
function calculate1to1TailMatching(leftCount, rightCount) {
    const left = leftCount;
    const right = rightCount;

    // Need at least 1 on each side, and a tail (extra) on one side
    // If equal: pairs = count - 1 (no tail on either side for the last one)
    // If unequal: pairs = min (the smaller side fully pairs, larger has tail)
    let totalMatches = 0;
    if (left > 0 && right > 0) {
        totalMatches = left === right
            ? Math.max(0, left - 1)
            : Math.min(left, right);
    }

    const leftConsumed = totalMatches;
    const rightConsumed = totalMatches;
    const carryLeft = left - leftConsumed;
    const carryRight = right - rightConsumed;

    return {
        totalMatches,
        membersConsumed: totalMatches * 2,
        leftConsumed, rightConsumed,
        carryLeft, carryRight,
        matchType: totalMatches > 0 ? '1:1' : 'none'
    };
}

/**
 * Credit leadership bonus to sponsor when referral earns income.
 * @param {PrismaClient} prismaClient - Transaction client (required)
 * @param {string} sponsorId - The sponsor's user ID
 * @param {number} referralEarning - Amount earned by the referral
 * @param {string} referralId - The referral's user ID (for audit trail)
 */
async function creditLeadershipBonus(prismaClient, sponsorId, referralEarning, referralId) {
    if (!prismaClient || !sponsorId || referralEarning <= 0) return null;

    const percent = parseInt(process.env.LEADERSHIP_BONUS_PERCENT || '10', 10);
    const dailyCap = parseInt(process.env.DAILY_LEADERSHIP_BONUS_CAP || '5000', 10);

    // Calculate bonus amount
    const bonusAmount = Math.floor((referralEarning * percent) / 100);
    if (bonusAmount <= 0) return null;

    // Check daily limit
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    let counter = await prismaClient.dailyLeadershipCounter.findFirst({
        where: { userId: sponsorId, date: { gte: todayStart, lt: todayEnd } }
    });

    const earnedToday = counter?.amount || 0;
    const remaining = Math.max(0, dailyCap - earnedToday);
    if (remaining <= 0) {
        // console.log(`[LEADERSHIP] Sponsor ${sponsorId} hit daily cap (${dailyCap})`);
        return null;
    }

    const actualBonus = Math.min(bonusAmount, remaining);

    // Credit wallet
    await prismaClient.wallet.upsert({
        where: { userId: sponsorId },
        update: { balance: { increment: actualBonus } },
        create: { userId: sponsorId, balance: actualBonus }
    });

    let referralLabel = null;
    if (referralId) {
        const referral = await prismaClient.user.findUnique({
            where: { id: referralId },
            select: { name: true, username: true, email: true }
        });
        referralLabel = referral?.name || referral?.username || referral?.email || null;
    }

    // Create transaction
    await prismaClient.transaction.create({
        data: {
            userId: sponsorId,
            type: 'LEADERSHIP_BONUS',
            amount: actualBonus,
            detail: referralLabel
                ? `Leadership bonus from ${referralLabel} (${percent}% of referral earnings)`
                : `Leadership bonus (${percent}% of referral earnings)`
        }
    });

    // Update daily counter
    try {
        await prismaClient.dailyLeadershipCounter.create({
            data: { userId: sponsorId, date: todayStart, amount: actualBonus }
        });
    } catch (e) {
        if (e?.code === 'P2002') {
            await prismaClient.dailyLeadershipCounter.updateMany({
                where: { userId: sponsorId, date: { gte: todayStart, lt: todayEnd } },
                data: { amount: { increment: actualBonus } }
            });
        } else throw e;
    }

    // console.log(`[LEADERSHIP] Credited ${actualBonus} to sponsor ${sponsorId} (${percent}% of ${referralEarning})`);
    return { sponsorId, amount: actualBonus };
}
/**
 * Credit direct referral bonus to sponsor wallet.
 */
async function creditDirectBonus(prismaClient, sponsorId, bv, referralId = null) {
    const bonusAmount = parseInt(process.env.DIRECT_BONUS_AMOUNT || '500', 10);
    const db = prismaClient || prisma;

    let referralLabel = null;
    if (referralId) {
        const referral = await db.user.findUnique({
            where: { id: referralId },
            select: { name: true, username: true, email: true }
        });
        referralLabel = referral?.name || referral?.username || referral?.email || null;
    }

    const detail = referralLabel
        ? `Direct bonus from ${referralLabel} (BV ${bv})`
        : `Direct bonus for referral (BV ${bv})`;

    if (prismaClient) {
        await prismaClient.transaction.create({
            data: { userId: sponsorId, type: 'DIRECT_BONUS', amount: bonusAmount, detail }
        });
        await prismaClient.wallet.upsert({
            where: { userId: sponsorId },
            update: { balance: { increment: bonusAmount } },
            create: { userId: sponsorId, balance: bonusAmount }
        });
        return;
    }

    await db.$transaction(async (tx) => {
        await tx.transaction.create({
            data: { userId: sponsorId, type: 'DIRECT_BONUS', amount: bonusAmount, detail }
        });
        await tx.wallet.upsert({
            where: { userId: sponsorId },
            update: { balance: { increment: bonusAmount } },
            create: { userId: sponsorId, balance: bonusAmount }
        });
    });
}

/**
 * Process matching bonus using 2:1 / 1:2 algorithm.
 */
async function processMatchingBonus(prismaClient, userId, dailyPairCap = null) {
    const db = prismaClient || prisma;
    const bonusPerMatch = parseInt(process.env.MATCHING_BONUS_PER_MATCH || '700', 10);
    const cap = dailyPairCap === null ? parseInt(process.env.DAILY_PAIR_CAP || '10', 10) : dailyPairCap;
    const lockKey = parseInt(crypto.createHash('sha256').update(userId).digest('hex').slice(0, 8), 16);

    const runMatching = async (tx) => {
        try { await tx.$executeRaw`SELECT pg_advisory_xact_lock(${BigInt(lockKey)})`; } catch (e) { }

        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user) return null;

        // Eligibility gate: user must have at least 2 direct referrals
        const directReferralCount = await tx.user.count({ where: { sponsorId: userId } });
        if (directReferralCount < 2) {
            // console.log(`[MATCHING] User ${userId} has ${directReferralCount} referrals (need 2). Skipping.`);
            return null;
        }

        const leftTotal = (user.leftMemberCount || 0) + (user.leftCarryCount || 0);
        const rightTotal = (user.rightMemberCount || 0) + (user.rightCarryCount || 0);
        if (leftTotal <= 0 || rightTotal <= 0) return null;

        // Use start and end of today for date comparison
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

        let counter = await tx.dailyPairCounter.findFirst({
            where: { userId, date: { gte: todayStart, lt: todayEnd } }
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

        // Update user counts
        await tx.user.update({
            where: { id: userId },
            data: {
                leftMemberCount: 0, rightMemberCount: 0,
                leftCarryCount: carryLeft, rightCarryCount: carryRight
            }
        });

        // Credit wallet
        await tx.wallet.upsert({
            where: { userId },
            update: { balance: { increment: bonus } },
            create: { userId, balance: bonus }
        });

        // Create payout record
        const payout = await tx.pairPayoutRecord.create({
            data: {
                userId, date: todayStart, pairs: matchesToPay, amount: bonus,
                matchType: '1:1', membersConsumed,
                leftConsumed: actualLeftConsumed,
                rightConsumed: actualRightConsumed
            }
        });

        // Create transaction
        await tx.transaction.create({
            data: { userId, type: 'MATCHING_BONUS', amount: bonus, detail: `Matching bonus: ${matchesToPay} pairs (1:1)` }
        });

        // Update daily counter
        try {
            await tx.dailyPairCounter.create({ data: { userId, date: todayStart, pairs: matchesToPay } });
        } catch (e) {
            if (e?.code === 'P2002') {
                await tx.dailyPairCounter.updateMany({ where: { userId, date: { gte: todayStart, lt: todayEnd } }, data: { pairs: { increment: matchesToPay } } });
            } else { throw e; }
        }

        // --- Rank Update Logic ---
        // Increment total pairs (User.totalPairs doesn't exist on 'user' object from findUnique unless we re-fetch or optimistically update)
        // We do an atomic increment to be safe and also check for rank upgrade

        // 1. Calculate new total pairs
        const currentTotalPairs = (user.totalPairs || 0);
        const newTotalPairs = currentTotalPairs + matchesToPay;

        // 2. Determine new rank
        let newRank = "Rookie";
        if (newTotalPairs >= 50000) newRank = "National Director";
        else if (newTotalPairs >= 20000) newRank = "Director";
        else if (newTotalPairs >= 10000) newRank = "Regional Manager";
        else if (newTotalPairs >= 5000) newRank = "Senior Manager";
        else if (newTotalPairs >= 1000) newRank = "Manager";
        else if (newTotalPairs >= 300) newRank = "Assistant Manager";
        else if (newTotalPairs >= 150) newRank = "Senior Team Leader";
        else if (newTotalPairs >= 100) newRank = "Team Leader";
        else if (newTotalPairs >= 50) newRank = "Senior Associate";
        else if (newTotalPairs >= 15) newRank = "Associate Executive";
        else newRank = "Rookie";


        // 3. Update User with new totalPairs and Rank (if changed)
        // Note: We already updated user counts above, so we can chain another update or merge them if performance is critical
        // Merging into the previous update call would be better but requires logic shift. Ideally we do one update.
        // For now, let's do a separate update to keep logic clean, or append to the previous one.
        // Let's do a meaningful update only if needed.

        // Actually, we can just perform the update. Since we are in a transaction, it's fine.
        // But wait, we already did `tx.user.update` for member counts. Let's optimize by adding this logic BEFORE that update and doing it in ONE go?
        // No, `matchesToPay` is calculated after. 
        // Let's just do a second update for now to be safe and simple.

        const updateData = { totalPairs: { increment: matchesToPay } };
        // Only update rank if it's "higher"? The logic implies simple threshold check is sufficient assuming pairs only go up.
        if (newRank !== user.rank) {
            updateData.rank = newRank;
            // Create RankChange record for admin reward tracking
            await tx.rankChange.create({
                data: {
                    userId,
                    fromRank: user.rank || 'None',
                    toRank: newRank,
                    pairsAtChange: newTotalPairs
                }
            });
            // console.log(`[RANK UPDATE] User ${userId} promoted from ${user.rank} to ${newRank} (${newTotalPairs} pairs)`);
        }

        await tx.user.update({
            where: { id: userId },
            data: updateData
        });

        try { const { broadcastPayout } = require('../routes/sse'); broadcastPayout(payout).catch?.(() => { }); } catch (e) { }

        // Trigger leadership bonus for user's sponsor
        if (user.sponsorId && bonus > 0) {
            await creditLeadershipBonus(tx, user.sponsorId, bonus, userId);
        }

        return payout;
    };

    if (prismaClient) return await runMatching(prismaClient);
    return await db.$transaction(runMatching);
}

module.exports = { creditDirectBonus, processMatchingBonus, calculate1to1TailMatching, creditLeadershipBonus };
