const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function seedTestUsers() {
    const password = await bcrypt.hash('Test@123', 10);
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });

    if (!admin) {
        console.log('No admin found. Please create an admin user first.');
        await prisma.$disconnect();
        return;
    }

    // Generate 50 users with varied data across different dates
    const testData = [
        { date: new Date('2026-01-28'), count: 5 },
        { date: new Date('2026-01-27'), count: 4 },
        { date: new Date('2026-01-26'), count: 4 },
        { date: new Date('2026-01-25'), count: 3 },
        { date: new Date('2026-01-22'), count: 4 },
        { date: new Date('2026-01-20'), count: 3 },
        { date: new Date('2026-01-18'), count: 4 },
        { date: new Date('2026-01-15'), count: 3 },
        { date: new Date('2026-01-12'), count: 4 },
        { date: new Date('2026-01-10'), count: 3 },
        { date: new Date('2026-01-05'), count: 4 },
        { date: new Date('2026-01-01'), count: 3 },
        { date: new Date('2025-12-25'), count: 3 },
        { date: new Date('2025-12-15'), count: 3 },
    ];

    const kycStatuses = ['NOT_STARTED', 'IN_PROGRESS', 'VERIFIED', 'FAILED'];
    const ranks = ['Rookie', 'Bronze', 'Silver', 'Gold', 'Platinum'];
    const firstNames = ['Amit', 'Priya', 'Rahul', 'Sneha', 'Vikash', 'Neha', 'Ravi', 'Anita', 'Suresh', 'Kavita'];
    const lastNames = ['Kumar', 'Singh', 'Sharma', 'Patel', 'Gupta', 'Verma', 'Joshi', 'Rani', 'Das', 'Reddy'];

    // Collect created users for parent assignment
    const createdUsers = [admin];
    let userIndex = 1;
    let totalCreated = 0;

    for (const { date, count } of testData) {
        for (let i = 0; i < count; i++) {
            const email = `testuser${userIndex}@test.com`;
            const existing = await prisma.user.findUnique({ where: { email } });

            if (!existing) {
                const firstName = firstNames[userIndex % firstNames.length];
                const lastName = lastNames[userIndex % lastNames.length];
                const fullName = `${firstName} ${lastName}`;

                // Pick a random parent from already created users
                const parentUser = createdUsers[Math.floor(Math.random() * createdUsers.length)];
                const position = userIndex % 2 === 0 ? 'LEFT' : 'RIGHT';

                // Varied KYC status - more verified as we go
                const kycIndex = userIndex < 20 ? Math.floor(Math.random() * 4) : 2; // Newer users more likely verified
                const kycStatus = kycStatuses[kycIndex];

                // Rank based on user age (older users = higher rank)
                const rankIndex = Math.min(Math.floor(userIndex / 12), ranks.length - 1);
                const rank = ranks[rankIndex];

                // Some users have purchases
                const hasPurchased = userIndex % 3 !== 0;

                // Generate some BV and member counts for realism
                const leftBV = hasPurchased ? Math.floor(Math.random() * 5000) : 0;
                const rightBV = hasPurchased ? Math.floor(Math.random() * 5000) : 0;
                const leftMemberCount = Math.floor(Math.random() * 10);
                const rightMemberCount = Math.floor(Math.random() * 10);
                const totalPairs = Math.min(leftMemberCount, rightMemberCount);

                const user = await prisma.user.create({
                    data: {
                        username: `TestUser${userIndex}`,
                        name: fullName,
                        email,
                        phone: `90000${String(userIndex).padStart(5, '0')}`,
                        password,
                        sponsorId: parentUser.id,
                        parentId: parentUser.id,
                        position,
                        hasPurchased,
                        kycStatus,
                        kycRefId: kycStatus === 'VERIFIED' ? `KYC${String(userIndex).padStart(6, '0')}` : null,
                        pan: kycStatus === 'VERIFIED' ? `ABCDE${String(1234 + userIndex)}F` : null,
                        aadhaar: kycStatus === 'VERIFIED' ? `${String(100000000000 + userIndex)}` : null,
                        rank,
                        totalPairs,
                        leftBV,
                        rightBV,
                        leftCarryBV: Math.floor(leftBV * 0.1),
                        rightCarryBV: Math.floor(rightBV * 0.1),
                        leftMemberCount,
                        rightMemberCount,
                        leftCarryCount: Math.floor(leftMemberCount * 0.2),
                        rightCarryCount: Math.floor(rightMemberCount * 0.2),
                        createdAt: date
                    }
                });

                // Create wallet with some balance
                await prisma.wallet.create({
                    data: {
                        userId: user.id,
                        balance: hasPurchased ? Math.floor(Math.random() * 10000) : 0
                    }
                });

                createdUsers.push(user);
                totalCreated++;
                console.log(`Created: ${email} (${fullName}) - ${rank} - ${kycStatus} on ${date.toISOString().split('T')[0]}`);
            } else {
                console.log(`Skipped: ${email} (already exists)`);
                createdUsers.push(existing);
            }
            userIndex++;
        }
    }

    console.log(`\nDone! Created ${totalCreated} test users across multiple dates.`);
    console.log(`Total users in createdUsers array: ${createdUsers.length}`);
    await prisma.$disconnect();
}

seedTestUsers().catch(e => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
});
