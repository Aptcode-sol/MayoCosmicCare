/**
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

function idTo32(userId) {
    // produce a stable 32-bit number from a string id for advisory lock
    const hex = crypto.createHash('sha256').update(userId).digest('hex').slice(0, 8)
    return parseInt(hex, 16)
}

/**
 * Credit direct referral bonus to sponsor wallet.
 * Wrapped in a transaction to ensure atomicity.
 */
async function creditDirectBonus(prismaClient, sponsorId, bv) {
    const bonusAmount = parseInt(process.env.DIRECT_BONUS_AMOUNT || '500', 10)
    const db = prismaClient || prisma
    // If a transaction client was provided, run the operations directly on it
    if (prismaClient) {
        await prismaClient.transaction.create({ data: { userId: sponsorId, type: 'DIRECT_BONUS', amount: bonusAmount, detail: `Direct bonus for referral (BV ${bv})` } })
        await prismaClient.wallet.upsert({
            where: { userId: sponsorId },
            update: { balance: { increment: bonusAmount } },
            create: { userId: sponsorId, balance: bonusAmount }
        })
        await prismaClient.auditLog.create({ data: { action: 'DIRECT_BONUS', actorId: sponsorId, meta: `amount:${bonusAmount},bv:${bv}` } })
        return
    }

    await db.$transaction(async (tx) => {
        await tx.transaction.create({ data: { userId: sponsorId, type: 'DIRECT_BONUS', amount: bonusAmount, detail: `Direct bonus for referral (BV ${bv})` } })

        await tx.wallet.upsert({
            where: { userId: sponsorId },
            update: { balance: { increment: bonusAmount } },
            create: { userId: sponsorId, balance: bonusAmount }
        })

        await tx.auditLog.create({ data: { action: 'DIRECT_BONUS', actorId: sponsorId, meta: `amount:${bonusAmount},bv:${bv}` } })
    })
}

/**
 * Process matching bonus safely: acquires an advisory lock for the user
 * and performs all reads/writes in a single transaction to avoid races.
 */
async function processMatchingBonus(prismaClient, userId, dailyPairCap = null) {
    const db = prismaClient || prisma
    const pairUnitBV = parseInt(process.env.PAIR_UNIT_BV || '7000', 10)
    const bonusPercent = parseFloat(process.env.MATCHING_PERCENT || '0.10')
    const cap = dailyPairCap === null ? parseInt(process.env.DAILY_PAIR_CAP || '10', 10) : dailyPairCap

    // hash userId to 32-bit key
    const lockKey = idTo32(userId)

    // If a transaction client is provided, perform operations directly on it
    if (prismaClient) {
        const tx = prismaClient
        try {
            // acquire advisory lock for the duration of this transaction if supported
            try { await tx.$executeRaw`SELECT pg_advisory_xact_lock(${BigInt(lockKey)})` } catch (e) { }
            const user = await tx.user.findUnique({ where: { id: userId } })
            if (!user) return

            const left = (user.leftBV || 0) + (user.leftCarryBV || 0)
            const right = (user.rightBV || 0) + (user.rightCarryBV || 0)
            const possiblePairsBV = Math.min(left, right)
            if (possiblePairsBV <= 0) return

            const maxPossiblePairs = Math.floor(possiblePairsBV / pairUnitBV)
            if (maxPossiblePairs <= 0) return

            const today = new Date(); today.setUTCHours(0, 0, 0, 0)
            let counter = await tx.dailyPairCounter.findFirst({ where: { userId, date: today } })
            const alreadyToday = counter ? counter.pairs : 0
            const availablePairsToday = Math.max(0, cap - alreadyToday)
            const pairsToPay = Math.min(maxPossiblePairs, availablePairsToday)
            if (pairsToPay <= 0) return

            const matchedBV = pairsToPay * pairUnitBV
            const bonus = Math.floor(matchedBV * bonusPercent)

            await tx.transaction.create({ data: { userId, type: 'MATCHING_BONUS', amount: bonus, detail: `Matching bonus for ${pairsToPay} pairs (${matchedBV} BV)` } })
            await tx.wallet.upsert({ where: { userId }, update: { balance: { increment: bonus } }, create: { userId, balance: bonus } })

            const newLeft = left - matchedBV
            const newRight = right - matchedBV
            await tx.user.update({ where: { id: userId }, data: { leftBV: 0, rightBV: 0, leftCarryBV: newLeft, rightCarryBV: newRight } })

            const payout = await tx.pairPayoutRecord.create({ data: { userId, date: today, pairs: pairsToPay, amount: bonus } })

            if (counter) {
                await tx.dailyPairCounter.update({ where: { id: counter.id }, data: { pairs: counter.pairs + pairsToPay } })
            } else {
                await tx.dailyPairCounter.create({ data: { userId, date: today, pairs: pairsToPay } })
            }

            await tx.auditLog.create({ data: { action: 'MATCHING_PAYOUT', actorId: userId, meta: `pairs:${pairsToPay},bv:${matchedBV},bonus:${bonus}` } })

            try {
                const { broadcastPayout } = require('../routes/sse')
                broadcastPayout(payout).catch?.(() => { })
            } catch (e) { }

            try { const { info } = require('../logger'); info('pair-payout', { userId, payoutId: payout.id, amount: bonus }) } catch (e) { }
        } finally {
            // nothing extra to do; advisory lock is session-scoped
        }
        return
    }

    await db.$transaction(async (tx) => {
        // acquire advisory lock for the duration of this transaction
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(${BigInt(lockKey)})`

        const user = await tx.user.findUnique({ where: { id: userId } })
        if (!user) return

        const left = (user.leftBV || 0) + (user.leftCarryBV || 0)
        const right = (user.rightBV || 0) + (user.rightCarryBV || 0)
        const possiblePairsBV = Math.min(left, right)
        if (possiblePairsBV <= 0) return

        const maxPossiblePairs = Math.floor(possiblePairsBV / pairUnitBV)
        if (maxPossiblePairs <= 0) return

        const today = new Date(); today.setUTCHours(0, 0, 0, 0)
        let counter = await tx.dailyPairCounter.findFirst({ where: { userId, date: today } })
        const alreadyToday = counter ? counter.pairs : 0
        const availablePairsToday = Math.max(0, cap - alreadyToday)
        const pairsToPay = Math.min(maxPossiblePairs, availablePairsToday)
        if (pairsToPay <= 0) return

        const matchedBV = pairsToPay * pairUnitBV
        const bonus = Math.floor(matchedBV * bonusPercent)

        // create transaction + atomic wallet increment
        await tx.transaction.create({ data: { userId, type: 'MATCHING_BONUS', amount: bonus, detail: `Matching bonus for ${pairsToPay} pairs (${matchedBV} BV)` } })
        await tx.wallet.upsert({
            where: { userId },
            update: { balance: { increment: bonus } },
            create: { userId, balance: bonus }
        })

        // compute carries and reset live legs atomically
        const newLeft = left - matchedBV
        const newRight = right - matchedBV
        await tx.user.update({ where: { id: userId }, data: { leftBV: 0, rightBV: 0, leftCarryBV: newLeft, rightCarryBV: newRight } })

        const payout = await tx.pairPayoutRecord.create({ data: { userId, date: today, pairs: pairsToPay, amount: bonus } })

        if (counter) {
            await tx.dailyPairCounter.update({ where: { id: counter.id }, data: { pairs: counter.pairs + pairsToPay } })
        } else {
            await tx.dailyPairCounter.create({ data: { userId, date: today, pairs: pairsToPay } })
        }

        await tx.auditLog.create({ data: { action: 'MATCHING_PAYOUT', actorId: userId, meta: `pairs:${pairsToPay},bv:${matchedBV},bonus:${bonus}` } })

        // broadcast (best-effort)
        try {
            const { broadcastPayout } = require('../routes/sse')
            broadcastPayout(payout).catch?.(() => { })
        } catch (e) {
            // ignore
        }

        try { const { info } = require('../logger'); info('pair-payout', { userId, payoutId: payout.id, amount: bonus }) } catch (e) { }
    })
}

module.exports = { creditDirectBonus, processMatchingBonus }
