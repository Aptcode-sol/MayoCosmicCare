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

    // Clean slate for products
    await prisma.product.deleteMany({});

    console.log('✓ Cleared old products');

    await prisma.product.create({
        data: {
            name: 'Bio Magnetic Mattress Pad Pro',
            price: 15900,
            bv: 60,
            stock: 500,
            description: 'Experience the pinnacle of restorative sleep with our advanced Bio Magnetic Mattress Pad. Engineered using rare-earth neodymium magnets strategically placed to align with your body\'s natural energy pathways. This premium pad utilizes pulsed magnetic field therapy to enhance blood circulation, oxygen delivery, and cellular repair while you sleep. The breathable, hypoallergenic upper layer ensures maximum comfort while the underlying magnetic matrix works tirelessly to reduce inflammation, alleviate joint pain, and protect your body from harmful environmental EMF radiation. Wake up feeling truly rejuvenated.',
            keyFeatures: 'Deep Restorative Sleep: Clinically designed to increase REM sleep cycles and natural melatonin production\nAdvanced Pain Relief: Strategically placed rare-earth magnets target pressure points to alleviate chronic joint and muscle pain\nEMF Shielding: Creates a protective magnetic barrier against harmful electromagnetic frequencies from household devices\nEnhanced Circulation: Micro-magnetic fields naturally stimulate blood flow and optimize cellular oxygen delivery',
            imageUrl: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
            directBonus: 3000,
            matchingBonus: 2000,
            dailyCap: 40000,
            taxPercent: 5.0,
            adminChargePercent: 5.0
        }
    });
    console.log('✓ Bio Magnetic Mattress Pad Pro created');

    console.log('\nSeed completed successfully!');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
