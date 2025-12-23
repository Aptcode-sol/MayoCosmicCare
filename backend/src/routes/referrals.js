const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authenticate } = require('../middleware/authMiddleware');

// Count all descendants in a subtree
async function countDescendants(userId) {
  if (!userId) return 0;

  const children = await prisma.user.findMany({
    where: { parentId: userId },
    select: { id: true }
  });

  let count = children.length;
  for (const child of children) {
    count += await countDescendants(child.id);
  }
  return count;
}

// Build binary tree structure from user
async function buildBinaryTree(userId, depth = 6) {
  if (depth <= 0 || !userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      position: true,
      createdAt: true,
      wallet: { select: { balance: true } },
      // Get children (users whose parentId is this user)
      children: {
        select: {
          id: true,
          position: true
        }
      }
    }
  });

  if (!user) return null;

  // Find left and right children from the children array
  const leftChildData = user.children.find(c => c.position === 'LEFT');
  const rightChildData = user.children.find(c => c.position === 'RIGHT');

  // Recursively build left and right subtrees
  const leftSubtree = leftChildData ? await buildBinaryTree(leftChildData.id, depth - 1) : null;
  const rightSubtree = rightChildData ? await buildBinaryTree(rightChildData.id, depth - 1) : null;

  // Calculate member counts dynamically from actual tree structure
  const leftMemberCount = leftChildData ? 1 + await countDescendants(leftChildData.id) : 0;
  const rightMemberCount = rightChildData ? 1 + await countDescendants(rightChildData.id) : 0;

  return {
    id: user.id,
    username: user.username,
    position: user.position || 'ROOT',
    leftMemberCount,
    rightMemberCount,
    walletBalance: user.wallet?.balance || 0,
    createdAt: user.createdAt,
    left: leftSubtree,
    right: rightSubtree
  };
}

router.get('/me', authenticate, async (req, res) => {
  try {
    const depth = parseInt(req.query.depth) || 6;
    const tree = await buildBinaryTree(req.user.id, depth);
    res.json({ ok: true, tree });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Failed to fetch referrals' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const depth = parseInt(req.query.depth) || 6;
    const tree = await buildBinaryTree(req.params.id, depth);
    res.json({ ok: true, tree });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Failed to fetch referrals' });
  }
});

module.exports = router;
