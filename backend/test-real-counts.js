const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    const users = await prisma.user.findMany({
        where: { role: 'USER' },
        orderBy: { createdAt: 'asc' },
        take: 1
    });

    const rootUser = users[0];
    const userRec = await prisma.user.findUnique({
        where: { id: rootUser.id },
        select: {
            children: {
                select: { id: true, position: true }
            }
        }
    });

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

    const leftChild = userRec.children.find(c => c.position === 'LEFT');
    const rightChild = userRec.children.find(c => c.position === 'RIGHT');

    const leftMemberCount = leftChild ? 1 + await countDescendants(leftChild.id) : 0;
    const rightMemberCount = rightChild ? 1 + await countDescendants(rightChild.id) : 0;

    console.log('Real Left Descendants:', leftMemberCount);
    console.log('Real Right Descendants:', rightMemberCount);

}
run().finally(() => prisma.$disconnect());
