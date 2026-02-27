const prisma = require('../prismaClient');
const { creditDirectBonus } = require('./commissionService');
const { addMatchingJob } = require('../queues/queue');
const { placeNewUser } = require('./placementService');

/**
 * Process purchase: reduce stock, create transaction, update BV up the uplines
 */
async function purchaseProduct(userId, productId, newSponsorId = null, leg = null) {
    console.log('[PURCHASE-SERVICE] Starting purchase:', { userId, productId });

    // 1. Pre-purchase: Handle missing sponsor / Placement
    // We must ensure the user has a sponsor and is placed in the tree BEFORE processing the purchase BV.
    const userToCheck = await prisma.user.findUnique({ where: { id: userId } });
    if (!userToCheck) throw new Error('User not found');

    // If user is not the first admin and has no sponsor/placement
    const isFirstAdmin = userToCheck.role === 'ADMIN' && (await prisma.user.count()) === 1;
    console.log('[PURCHASE] isFirstAdmin:', isFirstAdmin, 'User:', userToCheck.username, 'SponsorId:', userToCheck.sponsorId);


    if (!isFirstAdmin && (!userToCheck.sponsorId || !userToCheck.parentId)) {
        let sponsorIdToUse = userToCheck.sponsorId;

        // If no sponsor on record, one MUST be provided now
        if (!sponsorIdToUse) {
            console.log('[PURCHASE] Missing sponsor. Provided newSponsorId:', newSponsorId);
            if (!newSponsorId) {
                throw new Error('Sponsor is required for your first purchase to place you in the network.');
            }

            // --- Logic for Digit-based Placement (Copied from authService) ---
            let searchIdentifier = newSponsorId;
            let placementLeg = null;

            // Check if the last character is a digit
            const lastChar = newSponsorId.slice(-1);
            const isDigit = /^\d$/.test(lastChar);

            if (isDigit) {
                const digit = parseInt(lastChar, 10);
                placementLeg = (digit % 2 === 0) ? 'left' : 'right';
                searchIdentifier = newSponsorId.slice(0, -1);
            }

            // Validate new sponsor
            let sponsor = await prisma.user.findUnique({ where: { id: searchIdentifier } });
            if (!sponsor) sponsor = await prisma.user.findUnique({ where: { email: searchIdentifier } });
            if (!sponsor) sponsor = await prisma.user.findFirst({ where: { username: searchIdentifier } });

            // If not found with stripped ID, try the original ID (maybe digit is part of ID)
            if (!sponsor && isDigit) {
                let originalSponsor = await prisma.user.findUnique({ where: { id: newSponsorId } });
                if (!originalSponsor) originalSponsor = await prisma.user.findUnique({ where: { email: newSponsorId } });
                if (!originalSponsor) originalSponsor = await prisma.user.findFirst({ where: { username: newSponsorId } });

                if (originalSponsor) {
                    sponsor = originalSponsor;
                    placementLeg = null; // Digit was part of ID, ignore placement
                }
            }

            if (!sponsor) throw new Error('Invalid sponsor identifier');
            if (sponsor.isBlocked) throw new Error('Sponsor account is blocked');
            if (!sponsor.hasPurchased && sponsor.role !== 'ADMIN') throw new Error('Sponsor must have purchased a product');

            // Save sponsor to user
            await prisma.user.update({ where: { id: userId }, data: { sponsorId: sponsor.id } });
            sponsorIdToUse = sponsor.id;

            // Override leg if placementLeg was derived from the code
            if (placementLeg) leg = placementLeg;

            console.log('[PURCHASE] Assigned new sponsor:', sponsorIdToUse, 'to user:', userId, 'Leg:', leg);
        }

        // Place in tree if not yet placed
        if (!userToCheck.parentId && sponsorIdToUse) {
            console.log('[PURCHASE] Placing user in tree under sponsor:', sponsorIdToUse);
            await placeNewUser(userId, sponsorIdToUse, leg);
        }
    }


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

        const buyer = await tx.user.findUnique({ where: { id: userId } });

        await tx.transaction.create({ data: { userId, type: 'PURCHASE', amount: product.price, detail: `Purchase ${product.name}` } });

        // Check if this is buyer's first purchase (no prior PURCHASE transactions)
        // We count existing ones. Since we just created one above, if count is 1, it's the first.
        const purchaseCount = await tx.transaction.count({
            where: { userId, type: 'PURCHASE' }
        });
        const isFirstPurchase = purchaseCount === 1;
        console.log('[PURCHASE] User:', userId, 'isFirstPurchase:', isFirstPurchase, 'count:', purchaseCount);

        if (isFirstPurchase || !buyer.hasPurchased) {
            // Mark user as having purchased (enables referral ability)
            console.log('[PURCHASE] Marking user as hasPurchased=true');
            await tx.user.update({ where: { id: userId }, data: { hasPurchased: true } });
        }

        // Credit direct bonus to sponsor ONLY on buyer's FIRST purchase
        // const buyer = await tx.user.findUnique({ where: { id: userId } }); // Already fetched
        console.log('[PURCHASE] Refetched buyer:', buyer.id, 'Sponsor:', buyer.sponsorId, 'hasPurchased:', buyer.hasPurchased);
        let deferredDirectBonus = null;
        if (buyer && buyer.sponsorId) {
            if (isFirstPurchase) {
                try {
                    await creditDirectBonus(tx, buyer.sponsorId, product.bv, buyer.id);
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
        const visited = new Set();
        let loopCount = 0;
        const { processMatchingBonus } = require('./commissionService');
        while (current && current.parentId) {
            if (loopCount++ > 1000) {
                console.error('[PURCHASE] BV propagation depth exceeded limit (1000) for user:', userId);
                break;
            }
            if (visited.has(current.parentId)) {
                console.error('[PURCHASE] Cycle detected in BV propagation!', current.parentId);
                break;
            }
            visited.add(current.parentId);

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
            const result = await prisma.$transaction(runTx, { maxWait: 5000, timeout: 20000 })

            // After transaction commits, enqueue matching jobs for collected sponsors
            if (result && result.sponsorsToQueue && result.sponsorsToQueue.length) {
                for (const sponsorId of result.sponsorsToQueue) {
                    try {
                        await addMatchingJob(sponsorId);
                    } catch (e) {
                        try { const { error } = require('../logger'); error('queue-add-failed', { sponsorId, err: e.message }); } catch (e) { }
                    }
                }
            }

            // If direct bonus was deferred due to transaction issues, enqueue a fallback job to credit it
            if (result && result.deferredDirectBonus) {
                const d = result.deferredDirectBonus;
                try {
                    await addMatchingJob(d.sponsorId);
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
