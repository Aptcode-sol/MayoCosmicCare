const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

/**
 * Place a new user into the binary tree.
 * 
 * IMPORTANT: sponsorId and parentId are DIFFERENT:
 * - sponsorId = who REFERRED this person (never changes, for direct bonus)
 * - parentId = placement parent in binary tree (for matching structure)
 * 
 * @param {string} userId - The new user's ID (sponsorId already set during registration)
 * @param {string} sponsorId - The sponsor's ID (used as starting point for placement)
 * @param {string} preferredLeg - 'left' or 'right' (optional, for forced tail placement)
 */
async function placeNewUser(userId, sponsorId, preferredLeg = null) {
    if (!sponsorId) {
        // mark as ROOT if no sponsor
        await prisma.user.update({ where: { id: userId }, data: { position: 'ROOT', parentId: null } });
        return { placedUnder: null, position: 'ROOT' };
    }

    // Acquire an advisory lock to prevent concurrent placements
    let lockKey = null;
    try {
        const h = crypto.createHash('sha256').update(sponsorId).digest('hex');
        const prefix = h.slice(0, 16);
        lockKey = BigInt('0x' + prefix);
        await prisma.$executeRaw`SELECT pg_advisory_lock(${lockKey})`;
    } catch (e) {
        lockKey = null;
    }

    try {
        // If preferredLeg specified, use tail placement
        if (preferredLeg === 'left' || preferredLeg === 'right') {
            return await placeAtTail(userId, sponsorId, preferredLeg);
        }

        // Otherwise, use BFS-based auto-placement
        return await prisma.$transaction(async (tx) => {
            const sponsor = await tx.user.findUnique({ where: { id: sponsorId } });
            if (!sponsor) {
                await tx.user.update({ where: { id: userId }, data: { position: 'ROOT', parentId: null } });
                return { placedUnder: null, position: 'ROOT' };
            }

            // Try left first - check using parentId
            const leftChild = await tx.user.findFirst({ where: { parentId: sponsor.id, position: 'LEFT' } });
            if (!leftChild) {
                await tx.user.update({ where: { id: userId }, data: { position: 'LEFT', parentId: sponsor.id } });
                await propagateMemberCount(tx, sponsor.id, 'LEFT');
                return { placedUnder: sponsor.id, position: 'LEFT' };
            }

            // Try right
            const rightChild = await tx.user.findFirst({ where: { parentId: sponsor.id, position: 'RIGHT' } });
            if (!rightChild) {
                await tx.user.update({ where: { id: userId }, data: { position: 'RIGHT', parentId: sponsor.id } });
                await propagateMemberCount(tx, sponsor.id, 'RIGHT');
                return { placedUnder: sponsor.id, position: 'RIGHT' };
            }

            // Both filled - BFS for first node with empty slot
            const queue = [leftChild.id, rightChild.id];
            while (queue.length) {
                const nodeId = queue.shift();
                const node = await tx.user.findUnique({ where: { id: nodeId } });
                if (!node) continue;

                const nodeLeft = await tx.user.findFirst({ where: { parentId: node.id, position: 'LEFT' } });
                if (!nodeLeft) {
                    await tx.user.update({ where: { id: userId }, data: { position: 'LEFT', parentId: node.id } });
                    await propagateMemberCount(tx, node.id, 'LEFT');
                    return { placedUnder: node.id, position: 'LEFT' };
                }

                const nodeRight = await tx.user.findFirst({ where: { parentId: node.id, position: 'RIGHT' } });
                if (!nodeRight) {
                    await tx.user.update({ where: { id: userId }, data: { position: 'RIGHT', parentId: node.id } });
                    await propagateMemberCount(tx, node.id, 'RIGHT');
                    return { placedUnder: node.id, position: 'RIGHT' };
                }

                queue.push(nodeLeft.id);
                queue.push(nodeRight.id);
            }

            // Fallback
            await tx.user.update({ where: { id: userId }, data: { position: 'RIGHT', parentId: sponsor.id } });
            return { placedUnder: sponsor.id, position: 'RIGHT' };
        });
    } finally {
        if (lockKey) {
            try { await prisma.$executeRaw`SELECT pg_advisory_unlock(${lockKey})`; } catch (e) { }
        }
    }
}

/**
 * Place user at the tail (deepest position) of a specific leg.
 * Follows the specified leg all the way down until finding an empty slot.
 * 
 * NOTE: sponsorId is NOT changed - only parentId is set for placement
 */
async function placeAtTail(userId, sponsorId, leg) {
    const position = leg === 'left' ? 'LEFT' : 'RIGHT';

    return await prisma.$transaction(async (tx) => {
        let current = await tx.user.findUnique({ where: { id: sponsorId } });
        if (!current) {
            await tx.user.update({ where: { id: userId }, data: { position: 'ROOT', parentId: null } });
            return { placedUnder: null, position: 'ROOT' };
        }

        // Keep following the specified leg until we find an empty slot
        while (current) {
            // Find child in the specified position using parentId
            const child = await tx.user.findFirst({
                where: { parentId: current.id, position }
            });

            if (!child) {
                // Found empty slot - place here
                // IMPORTANT: Only set parentId, NOT sponsorId (sponsorId is the referrer)
                await tx.user.update({
                    where: { id: userId },
                    data: { position, parentId: current.id }
                });
                // Propagate member count up the tree from placement point
                await propagateMemberCount(tx, current.id, position);
                console.log(`[PLACEMENT] User ${userId} placed under ${current.id} at ${position} (tail of ${leg} leg)`);
                return { placedUnder: current.id, position };
            }
            current = child;
        }

        // Should never reach here
        await tx.user.update({
            where: { id: userId },
            data: { position, parentId: sponsorId }
        });
        return { placedUnder: sponsorId, position };
    });
}

/**
 * Propagate member count up the tree from the placement point.
 * Uses parentId to traverse up the tree (NOT sponsorId).
 */
async function propagateMemberCount(tx, startFromId, initialPosition) {
    let currentId = startFromId;
    let currentPosition = initialPosition;

    while (currentId) {
        const current = await tx.user.findUnique({ where: { id: currentId } });
        if (!current) break;

        // Increment the appropriate counter
        if (currentPosition === 'LEFT') {
            await tx.user.update({
                where: { id: currentId },
                data: { leftMemberCount: { increment: 1 } }
            });
        } else if (currentPosition === 'RIGHT') {
            await tx.user.update({
                where: { id: currentId },
                data: { rightMemberCount: { increment: 1 } }
            });
        }

        // Move up to parent using parentId (tree structure)
        if (current.parentId) {
            currentPosition = current.position; // This user's position relative to their parent
            currentId = current.parentId;
        } else {
            break;
        }
    }
}

module.exports = { placeNewUser, placeAtTail, propagateMemberCount };
