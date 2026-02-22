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

    await prisma.product.create({
        data: {
            name: 'Quantum Alkaline Water Ionizer',
            price: 24500,
            bv: 100,
            stock: 150,
            description: 'Transform your tap water into a powerful antioxidant with the Quantum Alkaline Water Ionizer. Utilizing Japanese platinum-titanium electrolysis plates, this state-of-the-art system creates micro-clustered, hydrogen-rich alkaline water that your body can absorb up to 6 times faster than regular water. Featuring a sophisticated 9-stage filtration process including activated carbon and nano-copper infusion, it strips away 99.99% of heavy metals, chlorine, and pathogens while retaining essential health-boosting minerals. Drink your way to better health, improved metabolic balance, and supreme hydration.',
            keyFeatures: 'Hydrogen Enrichment: Injects active molecular hydrogen to act as a potent antioxidant against cellular aging\nNano-Copper Filtration: 9-stage advanced filtration removes 99.99% of toxins while naturally infusing anti-bacterial copper ions\nMicro-Clustered Hydration: Breaks water molecules into smaller clusters for 6x faster cellular absorption and hydration\nSmart pH Control: Intuitive touch panel allows precise control of alkaline and acidic levels for drinking, cooking, or sanitizing',
            imageUrl: 'https://images.unsplash.com/photo-1579065560489-189a1b415e98?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
            directBonus: 5000,
            matchingBonus: 3500,
            dailyCap: 50000,
            taxPercent: 5.0,
            adminChargePercent: 5.0
        }
    });
    console.log('✓ Quantum Alkaline Water Ionizer created');

    console.log('\nSeed completed successfully!');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
