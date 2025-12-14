const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Build binary tree using parentId (placement tree) instead of sponsorId (referral).
 * The tree structure is based on where users are PLACED, not who referred them.
 */
async function buildTree(userId, depth = 0, maxDepth = 6) {
    if (!userId) return null;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            username: true,
            position: true,
            leftMemberCount: true,
            rightMemberCount: true,
            leftCarryCount: true,
            rightCarryCount: true,
            createdAt: true,
            wallet: { select: { balance: true } }
        }
    });

    if (!user) return null;
    if (depth >= maxDepth) return {
        ...user,
        walletBalance: user.wallet?.balance || 0,
        left: null,
        right: null
    };

    // Find children using parentId (placement tree structure)
    const leftChild = await prisma.user.findFirst({
        where: { parentId: userId, position: 'LEFT' },
        select: { id: true }
    });
    const rightChild = await prisma.user.findFirst({
        where: { parentId: userId, position: 'RIGHT' },
        select: { id: true }
    });

    return {
        id: user.id,
        username: user.username,
        position: user.position,
        leftMemberCount: user.leftMemberCount || 0,
        rightMemberCount: user.rightMemberCount || 0,
        leftCarryCount: user.leftCarryCount || 0,
        rightCarryCount: user.rightCarryCount || 0,
        walletBalance: user.wallet?.balance || 0,
        createdAt: user.createdAt,
        left: leftChild ? await buildTree(leftChild.id, depth + 1, maxDepth) : null,
        right: rightChild ? await buildTree(rightChild.id, depth + 1, maxDepth) : null,
    };
}

async function getUserTree(userId) {
    return await buildTree(userId, 0, 6);
}

module.exports = { getUserTree };
