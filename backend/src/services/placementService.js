const prisma = require('../prismaClient');
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
        // Use 15 chars to ensure it fits within Postgres signed 64-bit integer (max ~9e18)
        // 16 hex chars can represent u64 (up to 1.8e19), which overflows signed i64
        const prefix = h.slice(0, 15);
        lockKey = BigInt('0x' + prefix);
        // Pass as string and cast to bigint in SQL to avoid Prisma serialization issues
        await prisma.$executeRawUnsafe('SELECT pg_advisory_lock($1::bigint)', lockKey.toString());
    } catch (e) {
        console.warn('Failed to acquire advisory lock', e);
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
                return { placedUnder: sponsor.id, position: 'LEFT' };
            }

            // Try right
            const rightChild = await tx.user.findFirst({ where: { parentId: sponsor.id, position: 'RIGHT' } });
            if (!rightChild) {
                await tx.user.update({ where: { id: userId }, data: { position: 'RIGHT', parentId: sponsor.id } });
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
                    return { placedUnder: node.id, position: 'LEFT' };
                }

                const nodeRight = await tx.user.findFirst({ where: { parentId: node.id, position: 'RIGHT' } });
                if (!nodeRight) {
                    await tx.user.update({ where: { id: userId }, data: { position: 'RIGHT', parentId: node.id } });
                    return { placedUnder: node.id, position: 'RIGHT' };
                }

                queue.push(nodeLeft.id);
                queue.push(nodeRight.id);
            }

            // Fallback
            await tx.user.update({ where: { id: userId }, data: { position: 'RIGHT', parentId: sponsor.id } });
            return { placedUnder: sponsor.id, position: 'RIGHT' };
        }, { maxWait: 5000, timeout: 10000 });
    } finally {
        if (lockKey) {
            try { await prisma.$executeRawUnsafe('SELECT pg_advisory_unlock($1::bigint)', lockKey.toString()); } catch (e) { }
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
        let loopCount = 0;
        while (current) {
            if (loopCount++ > 1000) throw new Error('Placement depth exceeded safety limit');

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
                // console.log(`[PLACEMENT] User ${userId} placed under ${current.id} at ${position} (tail of ${leg} leg)`);
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
    }, { maxWait: 5000, timeout: 20000 });
}
module.exports = { placeNewUser, placeAtTail };
