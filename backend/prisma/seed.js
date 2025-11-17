const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

async function main() {
    // NOTE: This creates a seed admin for development only.
    // Change the password below or remove this script for production deployments.
    const seedPassword = 'Admin@2';
    const pass = await bcrypt.hash(seedPassword, 10);

    // Check if admin already exists
    let admin = await prisma.user.findUnique({ where: { email: 'admin@gmail.com' } });

    if (!admin) {
        admin = await prisma.user.create({
            data: {
                username: 'root',
                email: 'admin@gmail.com',
                password: pass,
                role: 'ADMIN',
                isEmailVerified: true,
                position: 'ROOT'
            }
        });

        // Create admin wallet
        await prisma.wallet.create({ data: { userId: admin.id } });
        console.log('✓ Admin user created: admin@gmail.com (password: Admin@2)');
    } else {
        console.log('✓ Admin user already exists (admin@gmail.com)');
    }

    const existingProduct = await prisma.product.findFirst({ where: { name: 'Standard Mattress' } });
    if (!existingProduct) {
        await prisma.product.create({
            data: {
                name: 'Standard Mattress',
                price: 15000,
                bv: 7000,
                stock: 50,
                description: 'Premium comfort mattress with 10-year warranty',
                imageUrl: 'https://via.placeholder.com/400x300'
            }
        });
        console.log('✓ Product created');
    } else {
        console.log('✓ Product already exists');
    }

    console.log('\nSeed completed successfully!');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
