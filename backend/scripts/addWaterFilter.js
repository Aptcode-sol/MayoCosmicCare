const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.product.findFirst({ where: { name: 'Water Filter' } });
  if (existing) {
    console.log('Water Filter already exists');
    return;
  }
  await prisma.product.create({
    data: {
      name: 'Water Filter',
      price: 4999,
      bv: 2000,
      stock: 100,
      description: 'Portable water filter - removes impurities',
      imageUrl: 'https://via.placeholder.com/400x300?text=Water+Filter'
    }
  });
  console.log('Water Filter created');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
