const prisma = require('../prismaClient');
const { creditDirectBonusInTx } = require('./commissionService');
const { addMatchingJob } = require('../queues/queue');
const { placeNewUser } = require('./placementService');
const { error } = require('../logger');

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
        if (buyer && buyer.sponsorId) {
            if (isFirstPurchase) {
                // No try/catch: a failure here must roll the purchase back.
                //
                // This used to be swallowed into a `deferredDirectBonus`, whose
                // "recovery" enqueued a MATCHING job — which pays a different
                // bonus type entirely and never credits the direct bonus. That
                // money was silently dropped. The old catch existed to defend
                // against nested-transaction errors, which cannot happen now that
                // this is a transaction-only helper.
                await creditDirectBonusInTx(tx, buyer.sponsorId, product.bv, buyer.id);
                console.log('[PURCHASE] Direct bonus credited to sponsor:', buyer.sponsorId);
            } else {
                console.log('[PURCHASE] Skipping direct bonus - not first purchase');
            }
        }

        // update BV and purchased member counts up the uplines using parentId (tree structure, not sponsorId)
        let current = buyer;
        const visited = new Set();
        let loopCount = 0;
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

            const parent = await tx.user.findUnique({
                where: { id: current.parentId },
                select: { id: true, parentId: true, position: true }
            });
            if (!parent) break;

            // Prepare update data for the parent
            const updateData = {};

            // Use current user's position relative to their parent.
            //
            // BV uses `increment`, not `parent.leftBV + product.bv`. The old
            // read-modify-write lost an increment whenever two purchases shared an
            // upline: both read the same value and the second overwrote the first.
            // Note the member count beside it was already atomic — the two
            // adjacent lines disagreed.
            if (current.position === 'LEFT') {
                updateData.leftBV = { increment: product.bv };
                if (isFirstPurchase) updateData.leftMemberCount = { increment: 1 };
            } else if (current.position === 'RIGHT') {
                updateData.rightBV = { increment: product.bv };
                if (isFirstPurchase) updateData.rightMemberCount = { increment: 1 };
            }

            await tx.user.update({ where: { id: parent.id }, data: updateData });
            sponsorsToQueue.push(parent.id);
            current = parent;
        }

        return { success: true, sponsorsToQueue };
    };

    // Retry transient transaction start failures
    const maxAttempts = 3
    let attempt = 0
    while (true) {
        attempt++
        try {
            const result = await prisma.$transaction(runTx, { maxWait: 5000, timeout: 20000 })

            // After the transaction commits, trigger matching for each upline.
            // addMatchingJob now falls back to inline processing if the queue is
            // unavailable, so a failure here means the payout genuinely could not
            // be made rather than the job merely being dropped — log it loudly.
            // The Phase 2 reconciliation sweep is the backstop.
            if (result && result.sponsorsToQueue && result.sponsorsToQueue.length) {
                for (const sponsorId of result.sponsorsToQueue) {
                    try {
                        await addMatchingJob(sponsorId);
                    } catch (err) {
                        error('matching_trigger_failed', { sponsorId, buyerId: userId, err: err.message });
                    }
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
