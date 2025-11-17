const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { processMatchingBonus } = require('../src/services/commissionService');

async function run(userId) {
    try {
        await processMatchingBonus(prisma, userId);
        console.log('Done');
    } catch (e) {
        console.error('Error running processMatchingBonus:', e);
    } finally {
        await prisma.$disconnect();
    }
}

const userId = process.argv[2];
if (!userId) { console.error('Usage: node runProcessMatching.js <userId>'); process.exit(2); }
run(userId).then(() => process.exit(0));
