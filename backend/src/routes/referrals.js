const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authenticate } = require('../middleware/authMiddleware');

function attachChildrenAndCount(node, userMap, depth) {
  if (depth <= 0 || !node) return null;

  node.left = null;
  node.right = null;
  node.leftMemberCount = 0;
  node.rightMemberCount = 0;

  const children = userMap.get(node.id) || [];

  const leftChildData = children.find(c => c.position === 'LEFT');
  const rightChildData = children.find(c => c.position === 'RIGHT');

  if (leftChildData) {
    node.left = attachChildrenAndCount(leftChildData, userMap, depth - 1);
    // Left member count = 1 (the child) + their descendants
    node.leftMemberCount = 1 + (node.left ? (node.left.leftMemberCount + node.left.rightMemberCount) : countAllDescendants(leftChildData, userMap));
  }

  if (rightChildData) {
    node.right = attachChildrenAndCount(rightChildData, userMap, depth - 1);
    // Right member count = 1 (the child) + their descendants
    node.rightMemberCount = 1 + (node.right ? (node.right.leftMemberCount + node.right.rightMemberCount) : countAllDescendants(rightChildData, userMap));
  }

  return {
    id: node.id,
    username: node.username,
    name: node.name,
    referredBy: node.referredBy,
    position: node.position,
    leftMemberCount: node.leftMemberCount,
    rightMemberCount: node.rightMemberCount,
    walletBalance: node.walletBalance,
    createdAt: node.createdAt,
    left: node.left,
    right: node.right
  };
}

// Helper to count physical descendants when they are beyond the requested build depth
function countAllDescendants(node, userMap) {
  let count = 0;
  const children = userMap.get(node.id) || [];
  for (const child of children) {
    count += 1 + countAllDescendants(child, userMap);
  }
  return count;
}

// Build binary tree structure from user
async function buildBinaryTree(userId, depth = 6) {
  if (!userId) return null;

  // 1. Fetch ALL users needed for tree building in one fast query
  // Since we only have ~1000 users, fetching all select fields is virtually instant vs 1000 slow recursive queries
  const allUsers = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      name: true,
      position: true,
      createdAt: true,
      parentId: true,
      sponsor: { select: { username: true } },
      wallet: { select: { balance: true } }
    }
  });

  // 2. Map all users by parentId for O(1) child lookups
  const userMap = new Map();
  let rootNode = null;

  for (const user of allUsers) {
    const formattedUser = {
      id: user.id,
      username: user.username,
      name: user.name,
      referredBy: user.sponsor?.username || '—',
      position: user.position || 'ROOT',
      parentId: user.parentId,
      walletBalance: user.wallet?.balance || 0,
      createdAt: user.createdAt
    };

    if (user.id === userId) {
      rootNode = formattedUser;
    }

    if (user.parentId) {
      if (!userMap.has(user.parentId)) {
        userMap.set(user.parentId, []);
      }
      userMap.get(user.parentId).push(formattedUser);
    }
  }

  if (!rootNode) return null;

  // 3. Build tree and counts recursively purely in memory
  return attachChildrenAndCount(rootNode, userMap, depth);
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
