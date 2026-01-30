/**
 * MLM Stress Test - Full Binary Tree via API
 * 
 * Uses HTTP requests to backend:
 * 1. Clear database (via Prisma - one-time setup)
 * 2. Register Sanket under Admin via API
 * 3. Build full binary tree - each user refers exactly 2 users (1 left + 1 right)
 * 
 * OTP: 123456 (fixed in otpService)
 * Sponsor code: sponsorId + 0 (left) or sponsorId + 1 (right)
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BASE_URL = 'http://localhost:4000/api';
const TEST_OTP = '123456';

// Config
const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = 'Admin@2';
const SANKET = { name: 'Sanket', email: 'sanket@gmail.com', password: 'Sanket@123' };
const USERS_PER_SIDE = 100;

// Report
const report = { created: 0, failures: [] };

async function http(endpoint, method = 'GET', body = null, token = null) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await res.json();

    if (!res.ok) {
        const errMsg = data.error || data.errors?.name || data.errors?.email || JSON.stringify(data);
        throw new Error(errMsg);
    }
    return data;
}

async function delay(ms) {
    return new Promise(r => setTimeout(r, ms));
}

async function clearDatabase() {
    console.log('\n🗑️  Clearing database...');

    const userIds = (await prisma.user.findMany({
        where: { role: 'USER' },
        select: { id: true }
    })).map(u => u.id);

    if (userIds.length === 0) {
        console.log('✅ No users to clear\n');
        await prisma.$disconnect();
        return;
    }

    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.pairPayoutRecord.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.dailyPairCounter.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.dailyLeadershipCounter.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.rankChange.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.transaction.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.withdrawal.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.wallet.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.refreshToken.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { role: 'USER' } });

    // Reset admin tree counters
    await prisma.user.updateMany({
        where: { role: 'ADMIN' },
        data: {
            leftBV: 0, rightBV: 0,
            leftCarryBV: 0, rightCarryBV: 0,
            leftMemberCount: 0, rightMemberCount: 0,
            leftCarryCount: 0, rightCarryCount: 0,
            totalPairs: 0
        }
    });

    console.log(`✅ Cleared ${userIds.length} users\n`);
    await prisma.$disconnect();
}

async function loginAdmin() {
    console.log('🔐 Logging in as admin...');
    const res = await http('/auth/admin-login', 'POST', {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
    });
    console.log('✅ Admin logged in');
    return res.tokens.accessToken;
}

async function getUser(token) {
    const res = await http('/auth/me', 'GET', null, token);
    return res.user;
}

async function sendOtp(email) {
    await http('/auth/send-otp', 'POST', { email });
}

async function registerUser(name, email, password, sponsorCode, productId) {
    // Send OTP first
    await sendOtp(email);
    await delay(20);

    // Register with OTP
    const res = await http('/auth/register', 'POST', {
        name,
        email,
        password,
        sponsorId: sponsorCode,  // sponsorId + digit for leg (0=left, 1=right)
        otp: TEST_OTP
    });

    // ============================================================================
    // TEMPORARY: Mark KYC as VERIFIED for testing (bypasses KYC requirement)
    // ============================================================================
    await prisma.user.update({
        where: { id: res.id },
        data: { kycStatus: 'VERIFIED' }
    });

    // ============================================================================
    // TEMPORARY: Auto-complete purchase immediately after registration
    // This bypasses the payment gateway by calling the purchase API directly
    // TODO: REMOVE when payment gateway is fully integrated and users pay normally
    // ============================================================================
    await makePurchase(res.id, email, password, productId);
    // ============================================================================

    report.created++;
    return res;
}

// Mark user as having purchased (required to be a sponsor)
// DEPRECATED: Now using makePurchase() which calls the actual purchase API
async function markAsPurchased(userId) {
    const { PrismaClient } = require('@prisma/client');
    const db = new PrismaClient();
    try {
        await db.user.update({
            where: { id: userId },
            data: { hasPurchased: true }
        });
    } finally {
        await db.$disconnect();
    }
}

async function loginUser(email, password) {
    const res = await http('/auth/login', 'POST', { email, password });
    return res.tokens.accessToken;
}

// Fetch first available product (mattress) from database
async function getProduct() {
    const product = await prisma.product.findFirst();
    if (!product) throw new Error('No products found in database');
    return product;
}

// ============================================================================
// TEMPORARY: Auto-complete purchase (bypasses payment gateway)
// TODO: REMOVE THIS SECTION when payment gateway is fully integrated
// ============================================================================
async function makePurchase(userId, email, password, productId) {
    try {
        // Login to get user token
        const token = await loginUser(email, password);

        // Make purchase API call
        await http(`/products/${productId}/purchase`, 'POST', {}, token);

        console.log(`   💳 Purchase completed for ${userId.slice(-6)}`);
    } catch (err) {
        console.error(`   ⚠️  Purchase failed for ${userId.slice(-6)}: ${err.message}`);
        // Don't throw - allow tree building to continue even if purchase fails
    }
}
// ============================================================================

/**
 * Build full binary tree using BFS
 * Each parent refers exactly 2 children (1 left + 1 right)
 * 
 * Structure:
 *       sanket
 *      /      \
 *    L1        R1
 *   /  \      /  \
 *  L2   L3  R2   R3
 *  ...
 */
async function buildBinaryTree(rootId, rootEmail, rootPassword, side, count, productId) {
    // Queue contains: { id, email, password, productId }
    const queue = [{ id: rootId, email: rootEmail, password: rootPassword, productId }];
    let created = 0;
    let index = 1;

    while (created < count && queue.length > 0) {
        const parent = queue.shift();

        // Each parent creates exactly 2 children: one left (digit 0), one right (digit 1)

        // Create LEFT child
        if (created < count) {
            const name = `${side.charAt(0).toUpperCase()}${index}`;
            const email = `${side}${index}@test.com`;
            const password = 'Test@123';
            const sponsorCode = parent.id + '0';  // 0 = LEFT

            try {
                const user = await registerUser(name, email, password, sponsorCode, parent.productId);
                console.log(`   ✓ ${name} (LEFT of ${parent.id.slice(-6)})`);
                queue.push({ id: user.id, email, password, productId: parent.productId });
                created++;
                index++;
            } catch (err) {
                console.error(`   ✗ ${name}: ${err.message}`);
                report.failures.push({ name, error: err.message });
            }
            await delay(30);
        }

        // Create RIGHT child
        if (created < count) {
            const name = `${side.charAt(0).toUpperCase()}${index}`;
            const email = `${side}${index}@test.com`;
            const password = 'Test@123';
            const sponsorCode = parent.id + '1';  // 1 = RIGHT

            try {
                const user = await registerUser(name, email, password, sponsorCode, parent.productId);
                console.log(`   ✓ ${name} (RIGHT of ${parent.id.slice(-6)})`);
                queue.push({ id: user.id, email, password, productId: parent.productId });
                created++;
                index++;
            } catch (err) {
                console.error(`   ✗ ${name}: ${err.message}`);
                report.failures.push({ name, error: err.message });
            }
            await delay(30);
        }
    }

    return created;
}

async function run() {
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║     MLM Stress Test - Full Binary Tree via API               ║');
    console.log('╠═══════════════════════════════════════════════════════════════╣');
    console.log(`║  Sanket: ${SANKET.email}                                   ║`);
    console.log(`║  Each user refers exactly 2 (1 left + 1 right)               ║`);
    console.log(`║  Target: ${USERS_PER_SIDE} left + ${USERS_PER_SIDE} right = ${USERS_PER_SIDE * 2} users                     ║`);
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    const start = Date.now();

    try {
        // Step 0: Clear database
        await clearDatabase();

        // Step 1: Login as admin
        const adminToken = await loginAdmin();
        const admin = await getUser(adminToken);
        console.log(`✅ Admin ID: ${admin.id}\n`);

        // Step 1.5: Get product for purchases
        const product = await getProduct();
        console.log(`✅ Product: ${product.name} (${product.id})\n`);

        // Step 2: Register Sanket under admin (LEFT)
        console.log('📝 Registering Sanket...');
        const sanket = await registerUser(SANKET.name, SANKET.email, SANKET.password, admin.id + '0', product.id);
        console.log(`✅ Sanket: ${sanket.id} (${sanket.username})\n`);

        // Step 3: Build LEFT tree under Sanket
        console.log(`🌳 Building LEFT tree (${USERS_PER_SIDE} users)...`);
        console.log('   Each parent refers 2 children\n');
        const leftCount = await buildBinaryTree(sanket.id, SANKET.email, SANKET.password, 'left', USERS_PER_SIDE, product.id);

        // Step 4: Build RIGHT tree under Sanket
        console.log(`\n🌳 Building RIGHT tree (${USERS_PER_SIDE} users)...`);
        const rightCount = await buildBinaryTree(sanket.id, SANKET.email, SANKET.password, 'right', USERS_PER_SIDE, product.id);

        // Report
        const time = ((Date.now() - start) / 1000).toFixed(1);
        console.log('\n');
        console.log('╔═══════════════════════════════════════════════════════════════╗');
        console.log('║                         REPORT                                ║');
        console.log('╠═══════════════════════════════════════════════════════════════╣');
        console.log(`║  Time: ${time}s                                                ║`);
        console.log(`║  Total Users: ${report.created} (+1 Sanket = ${report.created + 1})                        ║`);
        console.log(`║  Left Tree: ${leftCount} | Right Tree: ${rightCount}                           ║`);
        console.log(`║  Failures: ${report.failures.length}                                              ║`);
        console.log('╚═══════════════════════════════════════════════════════════════╝');

        if (report.failures.length > 0) {
            console.log('\n❌ First 5 failures:');
            report.failures.slice(0, 5).forEach((f, i) => {
                console.log(`   ${i + 1}. ${f.name}: ${f.error}`);
            });
        }

    } catch (err) {
        console.error('\n💥 Error:', err.message);
        process.exit(1);
    }
}

run().then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
