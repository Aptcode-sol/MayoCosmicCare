const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { creditDirectBonus } = require('./commissionService');
const { matchingQueue } = require('../queues/queue');

/**
 * Process purchase: reduce stock, create transaction, update BV up the uplines
 */
async function purchaseProduct(userId, productId) {
    // Collect sponsor IDs to enqueue matching jobs after the DB transaction commits
    const sponsorsToQueue = [];

    // Increase interactive transaction timeout slightly to allow complex operations
    return await prisma.$transaction(async (tx) => {
        const product = await tx.product.findUnique({ where: { id: productId } });
        if (!product) throw new Error('Product not found');
        if (product.stock <= 0) throw new Error('Out of stock');

        // reduce stock
        await tx.product.update({ where: { id: productId }, data: { stock: product.stock - 1 } });

        // create transaction
        await tx.transaction.create({ data: { userId, type: 'PURCHASE', amount: product.price, detail: `Purchase ${product.name}` } });

        // credit direct bonus to sponsor
        const buyer = await tx.user.findUnique({ where: { id: userId } });
        let deferredDirectBonus = null;
        if (buyer && buyer.sponsorId) {
            try {
                await creditDirectBonus(tx, buyer.sponsorId, product.bv);
            } catch (err) {
                // If the transaction client failed (e.g., transaction closed), defer the direct bonus
                deferredDirectBonus = { sponsorId: buyer.sponsorId, bv: product.bv };
                try { const { error } = require('../logger'); error('direct-bonus-deferred', { err: err.message }); } catch (e) { }
            }
        }

        // update BV up the uplines (add BV to sponsor's side based on position)
        let current = buyer;
        const { processMatchingBonus } = require('./commissionService');
        const { matchingQueue } = require('../queues/queue');
        while (current && current.sponsorId) {
            const sponsor = await tx.user.findUnique({ where: { id: current.sponsorId } });
            if (!sponsor) break;
            if (current.position === 'LEFT') {
                await tx.user.update({ where: { id: sponsor.id }, data: { leftBV: sponsor.leftBV + product.bv } });
            } else if (current.position === 'RIGHT') {
                await tx.user.update({ where: { id: sponsor.id }, data: { rightBV: sponsor.rightBV + product.bv } });
            }

            // Defer enqueueing until after transaction completes to avoid long transactions
            sponsorsToQueue.push(sponsor.id);

            current = sponsor;
        }
        return { success: true, sponsorsToQueue, deferredDirectBonus };
    }).then(async (result) => {
        // After transaction commits, enqueue matching jobs for collected sponsors
        if (result && result.sponsorsToQueue && result.sponsorsToQueue.length) {
            for (const sponsorId of result.sponsorsToQueue) {
                try {
                    await matchingQueue.add('matching-for-' + sponsorId, { userId: sponsorId });
                } catch (e) {
                    // log and continue
                    try { const { error } = require('../logger'); error('queue-add-failed', { sponsorId, err: e.message }); } catch (e) { }
                }
            }
        }
        // If direct bonus was deferred due to transaction issues, enqueue a fallback job to credit it
        if (result && result.deferredDirectBonus) {
            const d = result.deferredDirectBonus;
            try {
                await matchingQueue.add('direct-bonus-fallback-' + d.sponsorId, { sponsorId: d.sponsorId, bv: d.bv, type: 'direct' });
            } catch (e) {
                try { const { error } = require('../logger'); error('direct-bonus-enqueue-failed', { sponsorId: d.sponsorId, err: e.message }); } catch (e) { }
            }
        }
        return { success: true };
    });
}

module.exports = { purchaseProduct };
