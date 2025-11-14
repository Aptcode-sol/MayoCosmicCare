const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function buildTree(userId, depth = 0, maxDepth = 6) {
    if (!userId) return null;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, username: true, position: true, leftBV: true, rightBV: true } });
    if (!user) return null;
    if (depth >= maxDepth) return { ...user };
    // find direct children (left and right positions)
    const left = await prisma.user.findFirst({ where: { sponsorId: user.id, position: 'LEFT' }, select: { id: true } });
    const right = await prisma.user.findFirst({ where: { sponsorId: user.id, position: 'RIGHT' }, select: { id: true } });
    return {
        ...user,
        left: left ? await buildTree(left.id, depth + 1, maxDepth) : null,
        right: right ? await buildTree(right.id, depth + 1, maxDepth) : null,
    };
}

async function getUserTree(userId) {
    return await buildTree(userId, 0, 6);
}

module.exports = { getUserTree };
