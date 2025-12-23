/**
 * MLM Backend Test - Excel Report Generator
 * Generates CSV file with all test data
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function countDescendants(userId) {
    const children = await prisma.user.findMany({
        where: { parentId: userId },
        select: { id: true }
    });
    let count = children.length;
    for (const child of children) {
        count += await countDescendants(child.id);
    }
    return count;
}

async function generateExcelReport() {
    console.log('Generating Excel report...\n');
    
    const allUsers = await prisma.user.findMany({
        include: {
            wallet: true,
            transactions: true,
            children: { select: { id: true, position: true } },
            referrals: { select: { id: true } }
        },
        orderBy: { createdAt: 'asc' }
    });
    
    // CSV Header
    let csv = 'Username,Email,Role,Position,Left Count,Right Count,Expected Pairs,Direct Referrals,Direct Bonus Expected,Direct Bonus Actual,Matching Bonus Expected,Matching Bonus Actual,Wallet Balance,Status\n';
    
    let totalExpectedDirect = 0;
    let totalActualDirect = 0;
    let totalExpectedMatching = 0;
    let totalActualMatching = 0;
    
    for (const user of allUsers) {
        // Calculate left/right counts
        const leftChild = user.children.find(c => c.position === 'LEFT');
        const rightChild = user.children.find(c => c.position === 'RIGHT');
        const leftCount = leftChild ? 1 + await countDescendants(leftChild.id) : 0;
        const rightCount = rightChild ? 1 + await countDescendants(rightChild.id) : 0;
        
        // Calculate expected pairs (2:1/1:2 matching)
        let l = leftCount, r = rightCount, expectedPairs = 0;
        while ((l >= 2 && r >= 1) || (l >= 1 && r >= 2)) {
            if (l >= 2 && r >= 1) { l -= 2; r -= 1; expectedPairs++; }
            else if (l >= 1 && r >= 2) { l -= 1; r -= 2; expectedPairs++; }
            else break;
        }
        
        // Direct referrals count
        const directReferrals = user.referrals.length;
        
        // Expected bonuses
        const expectedDirect = directReferrals * 500;
        const expectedMatching = expectedPairs * 700;
        
        // Actual bonuses
        const actualDirect = user.transactions
            .filter(t => t.type === 'DIRECT_BONUS')
            .reduce((sum, t) => sum + t.amount, 0);
        const actualMatching = user.transactions
            .filter(t => t.type === 'MATCHING_BONUS')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const walletBalance = user.wallet?.balance || 0;
        
        // Status
        const status = (expectedDirect === actualDirect && expectedMatching === actualMatching) ? 'OK' : 'MISMATCH';
        
        // Add to totals
        totalExpectedDirect += expectedDirect;
        totalActualDirect += actualDirect;
        totalExpectedMatching += expectedMatching;
        totalActualMatching += actualMatching;
        
        // Escape commas in strings
        const escapeCsv = (str) => `"${String(str).replace(/"/g, '""')}"`;
        
        csv += `${escapeCsv(user.username)},${escapeCsv(user.email)},${user.role},${user.position || 'N/A'},${leftCount},${rightCount},${expectedPairs},${directReferrals},${expectedDirect},${actualDirect},${expectedMatching},${actualMatching},${walletBalance},${status}\n`;
    }
    
    // Add summary rows
    csv += `\n`;
    csv += `SUMMARY,,,,,,,,,,,,,\n`;
    csv += `Total Users,${allUsers.length},,,,,,,,,,,,\n`;
    csv += `Total Direct Bonus Expected,${totalExpectedDirect},,,,,,,,,,,,\n`;
    csv += `Total Direct Bonus Actual,${totalActualDirect},,,,,,,,,,,,\n`;
    csv += `Total Matching Bonus Expected,${totalExpectedMatching},,,,,,,,,,,,\n`;
    csv += `Total Matching Bonus Actual,${totalActualMatching},,,,,,,,,,,,\n`;
    
    // Add transaction history sheet data
    csv += `\n\n`;
    csv += `TRANSACTION HISTORY\n`;
    csv += `Username,Type,Amount,Detail,Date\n`;
    
    for (const user of allUsers) {
        for (const tx of user.transactions) {
            const escapeCsv = (str) => `"${String(str || '').replace(/"/g, '""')}"`;
            csv += `${escapeCsv(user.username)},${tx.type},${tx.amount},${escapeCsv(tx.detail)},${tx.createdAt.toISOString()}\n`;
        }
    }
    
    // Write CSV file
    fs.writeFileSync('mlm-test-report.csv', csv);
    console.log('✓ Report saved to: mlm-test-report.csv');
    console.log('  Open this file in Excel to view the data.\n');
    
    // Summary output
    console.log('SUMMARY:');
    console.log(`  Total Users: ${allUsers.length}`);
    console.log(`  Direct Bonus: Expected ₹${totalExpectedDirect} | Actual ₹${totalActualDirect}`);
    console.log(`  Matching Bonus: Expected ₹${totalExpectedMatching} | Actual ₹${totalActualMatching}`);
}

generateExcelReport()
    .catch(e => console.error('Error:', e))
    .finally(() => prisma.$disconnect());
