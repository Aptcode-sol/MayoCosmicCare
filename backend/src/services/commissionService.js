const prisma = require('../prismaClient');
const crypto = require('crypto');

/**
 * Calculate 2:1 / 1:2 matching for asymmetric binary plan.
 */
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
    let matchType = 'none';
    if (twoOneMatches > 0 && oneTwoMatches > 0) matchType = 'mixed';
    else if (twoOneMatches > 0) matchType = '2:1';
    else if (oneTwoMatches > 0) matchType = '1:2';

    // Calculate actual consumed from each side
    // 2:1 match: 2 left + 1 right
    // 1:2 match: 1 left + 2 right
    const leftConsumed = (twoOneMatches * 2) + (oneTwoMatches * 1);
    const rightConsumed = (twoOneMatches * 1) + (oneTwoMatches * 2);

    return {
        twoOneMatches, oneTwoMatches, totalMatches,
        membersConsumed: totalMatches * 3,
        leftConsumed, rightConsumed,
        carryLeft: left, carryRight: right, matchType
    };
}

/**
 * Credit direct referral bonus to sponsor wallet.
 */
async function creditDirectBonus(prismaClient, sponsorId, bv) {
    const bonusAmount = parseInt(process.env.DIRECT_BONUS_AMOUNT || '500', 10);
    const db = prismaClient || prisma;

    if (prismaClient) {
        await prismaClient.transaction.create({
            data: { userId: sponsorId, type: 'DIRECT_BONUS', amount: bonusAmount, detail: `Direct bonus for referral (BV ${bv})` }
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
            data: { userId: sponsorId, type: 'DIRECT_BONUS', amount: bonusAmount, detail: `Direct bonus for referral (BV ${bv})` }
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

        const result = calculate2to1Matching(leftTotal, rightTotal);
        if (result.totalMatches <= 0) return null;

        const matchesToPay = Math.min(result.totalMatches, remaining);
        const finalResult = calculate2to1Matching(leftTotal, rightTotal);
        const membersConsumed = matchesToPay * 3;
        const bonus = matchesToPay * bonusPerMatch;

        // Update user counts
        await tx.user.update({
            where: { id: userId },
            data: {
                leftMemberCount: 0, rightMemberCount: 0,
                leftCarryCount: finalResult.carryLeft, rightCarryCount: finalResult.carryRight
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
                matchType: finalResult.matchType, membersConsumed,
                leftConsumed: finalResult.leftConsumed,
                rightConsumed: finalResult.rightConsumed
            }
        });

        // Create transaction
        await tx.transaction.create({
            data: { userId, type: 'MATCHING_BONUS', amount: bonus, detail: `Matching bonus: ${matchesToPay} pairs (${finalResult.matchType})` }
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
            console.log(`[RANK UPDATE] User ${userId} promoted from ${user.rank} to ${newRank} (${newTotalPairs} pairs)`);
        }

        await tx.user.update({
            where: { id: userId },
            data: updateData
        });

        try { const { broadcastPayout } = require('../routes/sse'); broadcastPayout(payout).catch?.(() => { }); } catch (e) { }

        return payout;
    };

    if (prismaClient) return await runMatching(prismaClient);
    return await db.$transaction(runMatching);
}

module.exports = { creditDirectBonus, processMatchingBonus, calculate2to1Matching };
