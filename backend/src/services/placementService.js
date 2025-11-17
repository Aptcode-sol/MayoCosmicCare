const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Place a new user into the binary tree under sponsorId.
 * Algorithm:
 * - If sponsor has empty left -> place left
 * - Else if sponsor has empty right -> place right
 * - Else BFS from sponsor to find first node with an empty slot and place there
 * Uses a transaction to avoid race conditions (best-effort).
 */
async function placeNewUser(userId, sponsorId) {
    if (!sponsorId) {
        // mark as ROOT if no sponsor
        await prisma.user.update({ where: { id: userId }, data: { position: 'ROOT' } });
        return;
    }

    const crypto = require('crypto');

    // Acquire an advisory lock on sponsorId to prevent concurrent placements under the same sponsor.
    // Compute a stable 64-bit integer from the sponsorId string (sha256 -> take first 8 bytes).
    let lockKey = null;
    try {
        const h = crypto.createHash('sha256').update(sponsorId).digest('hex');
        const prefix = h.slice(0, 16);
        lockKey = BigInt('0x' + prefix);
        // use a non-transactional advisory lock so we can lock across the transaction boundary
        await prisma.$executeRaw`SELECT pg_advisory_lock(${lockKey})`;
    } catch (e) {
        // If raw lock fails (e.g., not Postgres), continue without lock but risk race.
        lockKey = null;
    }

    try {
        return await prisma.$transaction(async (tx) => {
            const sponsor = await tx.user.findUnique({ where: { id: sponsorId } });
            if (!sponsor) {
                await tx.user.update({ where: { id: userId }, data: { position: 'ROOT' } });
                return;
            }

            // place left: check if any child exists with sponsorId = sponsor.id and position = LEFT
            const leftChild = await tx.user.findFirst({ where: { sponsorId: sponsor.id, position: 'LEFT' } });
            if (!leftChild) {
                await tx.user.update({ where: { id: userId }, data: { position: 'LEFT', sponsorId: sponsor.id } });
                return;
            }

            // place right
            const rightChild = await tx.user.findFirst({ where: { sponsorId: sponsor.id, position: 'RIGHT' } });
            if (!rightChild) {
                await tx.user.update({ where: { id: userId }, data: { position: 'RIGHT', sponsorId: sponsor.id } });
                return;
            }

            // both filled - BFS for first node with empty slot
            const queue = [leftChild.id, rightChild.id];
            while (queue.length) {
                const nodeId = queue.shift();
                const node = await tx.user.findUnique({ where: { id: nodeId } });
                if (!node) continue;
                const nodeLeft = await tx.user.findFirst({ where: { sponsorId: node.id, position: 'LEFT' } });
                if (!nodeLeft) {
                    await tx.user.update({ where: { id: userId }, data: { position: 'LEFT', sponsorId: node.id } });
                    return;
                }
                const nodeRight = await tx.user.findFirst({ where: { sponsorId: node.id, position: 'RIGHT' } });
                if (!nodeRight) {
                    await tx.user.update({ where: { id: userId }, data: { position: 'RIGHT', sponsorId: node.id } });
                    return;
                }
                queue.push(nodeLeft.id);
                queue.push(nodeRight.id);
            }

            // fallback: attach directly to sponsor as RIGHT
            await tx.user.update({ where: { id: userId }, data: { position: 'RIGHT', sponsorId: sponsor.id } });
        });
    } finally {
        // release advisory lock if we acquired it
        if (lockKey) {
            try { await prisma.$executeRaw`SELECT pg_advisory_unlock(${lockKey})`; } catch (e) { }
        }
    }
}

module.exports = { placeNewUser };
