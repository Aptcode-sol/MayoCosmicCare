const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

async function main() {
    const password = 'User@123';
    const hashedPassword = await bcrypt.hash(password, 10);
    const email = 'sample@gmail.com';
    const username = 'sampleuser';

    const existingUser = await prisma.user.findUnique({
        where: { email }
    });

    if (existingUser) {
        console.log(`User ${email} already exists.`);
        return;
    }

    try {
        const user = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                role: 'USER',
                isEmailVerified: true
            }
        });

        await prisma.wallet.create({
            data: {
                userId: user.id
            }
        });

        console.log(`Successfully created user:`);
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        console.log(`Username: ${username}`);
    } catch (e) {
        console.error('Error creating user:', e);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
