const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function seedTestUsers() {
    const password = await bcrypt.hash('Test@123', 10);
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });

    const testData = [
        { date: new Date('2026-01-27'), count: 2 },
        { date: new Date('2026-01-26'), count: 3 },
        { date: new Date('2026-01-25'), count: 1 },
        { date: new Date('2026-01-20'), count: 4 },
        { date: new Date('2026-01-15'), count: 2 },
        { date: new Date('2026-01-10'), count: 3 },
        { date: new Date('2026-01-05'), count: 2 },
        { date: new Date('2026-01-01'), count: 1 },
        { date: new Date('2025-12-25'), count: 2 },
        { date: new Date('2025-12-15'), count: 3 },
        { date: new Date('2025-12-01'), count: 2 },
        { date: new Date('2025-11-20'), count: 1 },
        { date: new Date('2025-11-01'), count: 2 },
    ];

    let userIndex = 1;
    for (const { date, count } of testData) {
        for (let i = 0; i < count; i++) {
            const email = `testuser${userIndex}@test.com`;
            const existing = await prisma.user.findUnique({ where: { email } });
            if (!existing) {
                const user = await prisma.user.create({
                    data: {
                        username: `TestUser${userIndex}`,
                        email,
                        password,
                        parentId: admin?.id,
                        position: userIndex % 2 === 0 ? 'LEFT' : 'RIGHT',
                        hasPurchased: userIndex % 3 === 0,
                        createdAt: date
                    }
                });
                await prisma.wallet.create({ data: { userId: user.id } });
                console.log(`Created: ${email} on ${date.toISOString().split('T')[0]}`);
            } else {
                console.log(`Skipped: ${email} (already exists)`);
            }
            userIndex++;
        }
    }
    console.log('\\nDone! Created test users across multiple dates.');
    await prisma.$disconnect();
}

seedTestUsers().catch(e => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
});
