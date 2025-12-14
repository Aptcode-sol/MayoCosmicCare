const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { creditDirectBonus } = require('./commissionService');
const { matchingQueue } = require('../queues/queue');

/**
 * Process purchase: reduce stock, create transaction, update BV up the uplines
 */
async function purchaseProduct(userId, productId) {
    console.log('[PURCHASE-SERVICE] Starting purchase:', { userId, productId });
    // Collect sponsor IDs to enqueue matching jobs after the DB transaction commits
    const sponsorsToQueue = [];

    const runTx = async (tx) => {
        console.log('[PURCHASE-SERVICE] Inside transaction, decrementing stock...');
        // Atomically decrement stock if available
        const upd = await tx.product.updateMany({ where: { id: productId, stock: { gt: 0 } }, data: { stock: { decrement: 1 } } });
        console.log('[PURCHASE-SERVICE] Stock update result:', upd);
        if (!upd || upd.count === 0) throw new Error('Out of stock');

        const product = await tx.product.findUnique({ where: { id: productId } });
        if (!product) throw new Error('Product not found');

        await tx.transaction.create({ data: { userId, type: 'PURCHASE', amount: product.price, detail: `Purchase ${product.name}` } });

        // Credit direct bonus to sponsor ONLY on buyer's FIRST purchase
        const buyer = await tx.user.findUnique({ where: { id: userId } });
        let deferredDirectBonus = null;
        if (buyer && buyer.sponsorId) {
            // Check if this is buyer's first purchase (no prior PURCHASE transactions)
            const existingPurchases = await tx.transaction.count({
                where: { userId, type: 'PURCHASE' }
            });

            // existingPurchases will be 1 because we just created the current purchase above
            // So first purchase means count === 1
            const isFirstPurchase = existingPurchases === 1;
            console.log('[PURCHASE] User:', userId, 'isFirstPurchase:', isFirstPurchase, 'existingCount:', existingPurchases);

            if (isFirstPurchase) {
                try {
                    await creditDirectBonus(tx, buyer.sponsorId, product.bv);
                    console.log('[PURCHASE] Direct bonus credited to sponsor:', buyer.sponsorId);
                } catch (err) {
                    const msg = String(err?.message || err).toLowerCase()
                    if (msg.includes('transaction') || msg.includes('unable to start a transaction') || msg.includes('transaction not found')) {
                        throw err
                    }
                    deferredDirectBonus = { sponsorId: buyer.sponsorId, bv: product.bv };
                    try { const { error } = require('../logger'); error('direct-bonus-deferred', { err: err.message }); } catch (e) { }
                }
            } else {
                console.log('[PURCHASE] Skipping direct bonus - not first purchase');
            }
        }

        // update BV up the uplines using parentId (tree structure, not sponsorId)
        let current = buyer;
        const { processMatchingBonus } = require('./commissionService');
        while (current && current.parentId) {
            const parent = await tx.user.findUnique({ where: { id: current.parentId } });
            if (!parent) break;
            // Use current user's position relative to their parent
            if (current.position === 'LEFT') {
                await tx.user.update({ where: { id: parent.id }, data: { leftBV: parent.leftBV + product.bv } });
            } else if (current.position === 'RIGHT') {
                await tx.user.update({ where: { id: parent.id }, data: { rightBV: parent.rightBV + product.bv } });
            }
            sponsorsToQueue.push(parent.id);
            current = parent;
        }

        return { success: true, sponsorsToQueue, deferredDirectBonus };
    };

    // Retry transient transaction start failures
    const maxAttempts = 3
    let attempt = 0
    while (true) {
        attempt++
        try {
            const result = await prisma.$transaction(runTx)

            // After transaction commits, enqueue matching jobs for collected sponsors
            if (result && result.sponsorsToQueue && result.sponsorsToQueue.length) {
                for (const sponsorId of result.sponsorsToQueue) {
                    try {
                        await matchingQueue.add('matching-for-' + sponsorId, { userId: sponsorId });
                    } catch (e) {
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
        } catch (err) {
            const msg = String(err?.message || err)
            if (msg.includes('Unable to start a transaction') && attempt < maxAttempts) {
                await new Promise(r => setTimeout(r, 100 * attempt))
                continue
            }
            throw err
        }
    }
}

module.exports = { purchaseProduct };
