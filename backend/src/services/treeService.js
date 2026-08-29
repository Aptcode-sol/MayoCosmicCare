const prisma = require('../prismaClient');

// Attach children + counts to a node, recursively, up to `depth` levels.
// Beyond `depth`, leftMemberCount/rightMemberCount are still computed accurately
// via countAllDescendants so the UI can show "N more members" without rendering them.
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
    hasPurchased: node.hasPurchased,
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

// Build a binary tree rooted at `rootUserId`, down to `depth` levels.
// Fetches all users in one query and recurses in memory (see project notes: at
// current user-base size this is far cheaper than one recursive DB query per node).
async function buildTreeForUser(rootUserId, depth = 6) {
  if (!rootUserId) return null;

  const allUsers = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      name: true,
      position: true,
      hasPurchased: true,
      createdAt: true,
      parentId: true,
      sponsor: { select: { username: true } },
      wallet: { select: { balance: true } }
    }
  });

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
      hasPurchased: user.hasPurchased,
      walletBalance: user.wallet?.balance || 0,
      createdAt: user.createdAt
    };

    if (user.id === rootUserId) {
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

  return attachChildrenAndCount(rootNode, userMap, depth);
}

// Resolve the platform's topmost user (no parent) — used as the admin default root.
async function findPlatformRoot() {
  return prisma.user.findFirst({
    where: { parentId: null },
    select: { id: true },
    orderBy: { createdAt: 'asc' }
  });
}

// Walk the parentId chain from a user up to the platform root — O(depth) round
// trips, cheap since binary-tree depth stays ~log2(N). Returns full breadcrumb-
// ready objects so the frontend can render "Me › Rahul K. › Priya S." directly.
async function getAncestorPath(userId) {
  const path = [];
  let currentId = userId;
  const seen = new Set(); // guard against any parentId cycle from bad data
  while (currentId && !seen.has(currentId)) {
    seen.add(currentId);
    const u = await prisma.user.findUnique({
      where: { id: currentId },
      select: { id: true, username: true, name: true, parentId: true }
    });
    if (!u) break;
    path.unshift({ id: u.id, username: u.username, name: u.name });
    currentId = u.parentId;
  }
  return path; // [{id,username,name}, ...] root-to-target order, inclusive of the target
}

async function searchUsers(query, limit = 20) {
  return prisma.user.findMany({
    where: {
      OR: [
        { id: query },
        { username: { contains: query, mode: 'insensitive' } },
        { name: { contains: query, mode: 'insensitive' } }
      ]
    },
    select: { id: true, username: true, name: true, position: true, parentId: true },
    take: limit
  });
}

module.exports = { buildTreeForUser, countAllDescendants, findPlatformRoot, getAncestorPath, searchUsers };
