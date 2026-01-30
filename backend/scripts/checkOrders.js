const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    const orders = await prisma.order.count();
    const purchases = await prisma.transaction.count({ where: { type: 'PURCHASE' } });
    console.log('Orders:', orders);
    console.log('Purchases (transactions):', purchases);
    await prisma.$disconnect();
}

run();
