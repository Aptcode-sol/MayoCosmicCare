const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { creditDirectBonus } = require('./commissionService');

/**
 * Process purchase: reduce stock, create transaction, update BV up the uplines
 */
async function purchaseProduct(userId, productId) {
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
        if (buyer && buyer.sponsorId) {
            await creditDirectBonus(tx, buyer.sponsorId, product.bv);
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

            // enqueue matching job for sponsor to be processed asynchronously
            await matchingQueue.add('matching-for-' + sponsor.id, { userId: sponsor.id });

            current = sponsor;
        }
        return { success: true };
    });
}

module.exports = { purchaseProduct };
