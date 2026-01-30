/**
 * Fix Order Status - Mark all orders from stress test as PAID
 * Since purchases were auto-completed in stress test, orders should have status = 'PAID'
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    try {
        console.log('\n╔═══════════════════════════════════════════════════════════╗');
        console.log('║         Fixing Order Status for Stress Test Orders        ║');
        console.log('╚═══════════════════════════════════════════════════════════╝\n');

        // Count orders by status
        const orderStats = await prisma.order.groupBy({
            by: ['status'],
            _count: true
        });

        console.log('Current Order Status:');
        for (const stat of orderStats) {
            console.log(`  ${stat.status}: ${stat._count} orders`);
        }
        console.log('');

        // Mark all PENDING orders as PAID (since purchases were auto-completed)
        const result = await prisma.order.updateMany({
            where: { status: 'PENDING' },
            data: { status: 'PAID' }
        });

        console.log(`✅ Updated ${result.count} orders from PENDING to PAID\n`);

        // Show updated status
        const updatedStats = await prisma.order.groupBy({
            by: ['status'],
            _count: true
        });

        console.log('Updated Order Status:');
        for (const stat of updatedStats) {
            console.log(`  ${stat.status}: ${stat._count} orders`);
        }
        console.log('');

        // Get revenue stats
        const totalRevenue = await prisma.order.aggregate({
            _sum: { totalAmount: true },
            where: { status: 'PAID' }
        });

        const totalOrders = await prisma.order.count({ where: { status: 'PAID' } });

        console.log('╔═══════════════════════════════════════════════════════════╗');
        console.log('║                       SUMMARY                             ║');
        console.log('╠═══════════════════════════════════════════════════════════╣');
        console.log(`║  Total Orders: ${totalOrders}                                      ║`);
        console.log(`║  Total Revenue: ₹${(totalRevenue._sum.totalAmount || 0).toLocaleString()}                        ║`);
        console.log('╚═══════════════════════════════════════════════════════════╝\n');

    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

run().then(() => {
    console.log('✨ Done!\n');
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
