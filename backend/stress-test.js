/**
 * MLM Backend Stress Test via HTTP Requests
 * Simulates frontend requests to test the backend API
 * Creates 60 users (30 left, 30 right) with binary tree structure
 * Each user purchases a mattress through the API
 * NOW INCLUDES: OTP Registration Flow & Payout Simulation
 */

const BASE_URL = 'http://localhost:4000/api';
const OTP_CODE = '123456'; // Defined in otpService.js

// Admin credentials
const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = 'Admin@2';

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Test stats
const report = {
    usersCreated: 0,
    purchasesMade: 0,
    failures: [],
    timeline: [],
    payoutsRequested: 0,
    payoutsApproved: 0
};

// Store created users with their tokens
const createdUsers = [];

async function httpRequest(endpoint, method = 'GET', body = null, token = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        }
    };

    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || data.message || `HTTP ${response.status}`);
    }

    return data;
}

async function loginAdmin() {
    console.log('🔐 Logging in as admin...');
    try {
        const result = await httpRequest('/auth/admin-login', 'POST', {
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD
        });
        console.log('✅ Admin login successful');

        // Auto-verify Admin KYC (in case DB is dirty)
        const token = result.tokens.accessToken;
        const me = await httpRequest('/auth/me', 'GET', null, token);
        await prisma.user.update({
            where: { id: me.user.id },
            data: { kycStatus: 'VERIFIED' }
        });
        console.log('✅ Admin KYC Verified');

        return token;
    } catch (error) {
        console.error('❌ Admin login failed:', error.message);
        throw error;
    }
}

async function getAdminUser(token) {
    console.log('📋 Getting admin user info...');
    const result = await httpRequest('/auth/me', 'GET', null, token);
    const user = result.user || result;
    console.log('✅ Admin ID:', user.id);
    return user;
}

async function requestOtp(email) {
    // console.log(`📧 Requesting OTP for ${email}...`);
    await httpRequest('/auth/send-otp', 'POST', { email });
    // console.log(`✅ OTP sent to ${email}`);
}

async function registerUser(username, email, phone, password, sponsorId, leg) {
    const startTime = Date.now();
    try {
        console.log(`📝 Registering user: ${username} (sponsor: ${sponsorId?.substring(0, 8)}... leg: ${leg})`);

        // Step 1: Request OTP
        await requestOtp(email);

        // Step 2: Register with OTP
        const result = await httpRequest('/auth/register', 'POST', {
            username,
            email,
            password,
            phone,
            sponsorId,
            leg,
            otp: OTP_CODE // Include OTP
        });

        // Step 2.5: Auto-verify KYC (Direct DB Update for Test)
        await prisma.user.update({
            where: { id: result.id },
            data: { kycStatus: 'VERIFIED' }
        });
        console.log(`✅ KYC Verified for ${username}`);

        const duration = Date.now() - startTime;
        report.usersCreated++;
        console.log(`✅ Registered ${username} in ${duration}ms (ID: ${result.id})`);

        report.timeline.push({
            action: 'register',
            user: username,
            duration,
            success: true
        });

        return result;
    } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`❌ Failed to register ${username}:`, error.message);
        report.failures.push({ action: 'register', user: username, error: error.message });
        report.timeline.push({
            action: 'register',
            user: username,
            duration,
            success: false,
            error: error.message
        });
        throw error;
    }
}

async function loginUser(email, password) {
    const result = await httpRequest('/auth/login', 'POST', { email, password });
    return result.tokens.accessToken;
}

async function purchaseProduct(token, productId, username) {
    const startTime = Date.now();
    try {
        console.log(`🛒 ${username} purchasing product...`);

        const result = await httpRequest(`/products/${productId}/purchase`, 'POST', null, token);

        const duration = Date.now() - startTime;
        report.purchasesMade++;
        console.log(`✅ ${username} purchase complete in ${duration}ms`);

        report.timeline.push({
            action: 'purchase',
            user: username,
            duration,
            success: true
        });

        return result;
    } catch (error) {
        const duration = Date.now() - startTime;
        if (error.message.includes('Already purchased')) {
            console.log(`ℹ️ ${username} already purchased.`);
            return { message: 'Already purchased' };
        }
        console.error(`❌ ${username} purchase failed:`, error.message);
        report.failures.push({ action: 'purchase', user: username, error: error.message });
        report.timeline.push({
            action: 'purchase',
            user: username,
            duration,
            success: false,
            error: error.message
        });
        throw error;
    }
}

async function requestPayout(token, amount, username) {
    try {
        console.log(`💸 ${username} requesting payout of ₹${amount}...`);
        const bankDetails = {
            accountInfo: {
                bankAccount: '1234567890',
                ifsc: 'HDFC0001234'
            },
            name: username,
            email: 'test@test.com',
            phone: '9999999999'
        };

        const result = await httpRequest('/payouts/request', 'POST', { amount, bankDetails }, token);
        console.log(`✅ Payout requested for ${username} (ID: ${result.id})`);
        report.payoutsRequested++;
        return result;
    } catch (error) {
        console.error(`❌ Payout request failed for ${username}:`, error.message);
        report.failures.push({ action: 'payout_request', user: username, error: error.message });
        // Don't throw, just log failure (maybe insufficient balance)
    }
}

async function approvePayout(adminToken, withdrawalId) {
    try {
        console.log(`👮 Admin approving payout ${withdrawalId}...`);
        await httpRequest(`/payouts/approve/${withdrawalId}`, 'POST', null, adminToken);
        console.log(`✅ Payout ${withdrawalId} approved/executed.`);
        report.payoutsApproved++;
    } catch (error) {
        console.error(`❌ Failed to approve payout ${withdrawalId}:`, error.message);
        report.failures.push({ action: 'payout_approve', user: 'admin', error: error.message });
    }
}

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runStressTest() {
    console.log('╔═══════════════════════════════════════════════════╗');
    console.log('║     MLM Backend Stress Test via HTTP Requests     ║');
    console.log('╠═══════════════════════════════════════════════════╣');
    console.log('║  60 users (30 left, 30 right)                     ║');
    console.log('║  Sequential registration + purchase + OTP         ║');
    console.log('║  + Payout Simulation                              ║');
    console.log('╚═══════════════════════════════════════════════════╝\n');

    const totalStartTime = Date.now();

    try {
        // Step 1: Login as admin
        const adminToken = await loginAdmin();
        const admin = await getAdminUser(adminToken);

        // Step 1.5: Fetch available product
        console.log('📦 Fetching product details...');
        const products = await httpRequest('/public/products', 'GET', null, adminToken);
        const product = products.products ? products.products[0] : products[0];

        if (!product) {
            throw new Error('No products found in database. Run seed script first.');
        }

        const dynamicProductId = product.id;
        console.log(`✅ Using Product: ${product.name} (ID: ${dynamicProductId}, Stock: ${product.stock})`);

        // Step 2: Admin makes first purchase
        console.log('\n📦 Admin making initial purchase to enable referrals...');
        try {
            await purchaseProduct(adminToken, dynamicProductId, 'admin');
        } catch (e) {
            console.log('ℹ️ Admin may have already purchased (continuing...)');
        }

        // Step 3: Create 'sanket' user (Root)
        console.log('\n═══════════════════════════════════════════════════');
        console.log('   Creating Root User: sanket');
        console.log('═══════════════════════════════════════════════════\n');

        let sanketUser;
        try {
            sanketUser = await registerUser('sanket', 'sanket@gmail.com', '9999999999', 'Sanket@123', admin.id, 'left');
            await delay(100);
            const token = await loginUser('sanket@gmail.com', 'Sanket@123');
            await purchaseProduct(token, dynamicProductId, 'sanket');
            sanketUser.token = token;
            createdUsers.push(sanketUser);
        } catch (e) {
            console.log('⚠️ Sanket user might already exist, trying to login...');
            try {
                const token = await loginUser('sanket@gmail.com', 'Sanket@123');
                const me = await httpRequest('/auth/me', 'GET', null, token);
                sanketUser = me.user || me;
                sanketUser.token = token;
                console.log(`✅ Loaded existing sanket user (ID: ${sanketUser.id})`);
                await purchaseProduct(token, dynamicProductId, 'sanket').catch(() => { });
            } catch (err) {
                throw new Error('Could not create or login sanket user: ' + err.message);
            }
        }

        // Step 4: Generate Tree
        console.log('\n═══════════════════════════════════════════════════');
        console.log('   Generating Binary Tree');
        console.log('═══════════════════════════════════════════════════\n');

        const queue = [sanketUser];
        let usersCreatedCount = 0;
        const TOTAl_USERS_TO_CREATE = 200; // 100 left side + 100 right side

        while (usersCreatedCount < TOTAl_USERS_TO_CREATE && queue.length > 0) {
            const parent = queue.shift();

            // Helper to create child
            const createChild = async (side) => {
                if (usersCreatedCount >= TOTAl_USERS_TO_CREATE) return;

                usersCreatedCount++;
                const username = `user_${usersCreatedCount}`;
                const email = `user${usersCreatedCount}@test.com`;
                const password = 'Test@123';
                const phone = `800${usersCreatedCount.toString().padStart(7, '0')}`; // Ensure unique phone

                try {
                    const user = await registerUser(username, email, phone, password, parent.id, side);
                    await delay(50);
                    const token = await loginUser(email, password);
                    await purchaseProduct(token, dynamicProductId, username);

                    user.token = token;
                    queue.push(user);
                } catch (err) {
                    console.error(`⚠️ Failed to add ${side} child for ${parent.username}`);
                    usersCreatedCount--; // Retry logic or just skip? logic simpler to just skip
                }
            };

            await createChild('left');
            await createChild('right');
        }

        // Step 5: Payout Simulation
        console.log('\n═══════════════════════════════════════════════════');
        console.log('   Simulating Payouts for Root User (sanket)');
        console.log('═══════════════════════════════════════════════════\n');

        // Refresh 'sanket' wallet balance
        const sanketMe = await httpRequest('/auth/me', 'GET', null, sanketUser.token);
        const balance = sanketMe.user?.wallet?.balance || 0;
        console.log(`💰 Sanket current balance: ₹${balance}`);

        if (balance >= 1000) {
            const withdrawal = await requestPayout(sanketUser.token, 1000, 'sanket');
            if (withdrawal && withdrawal.id) {
                // Simulate Admin Approval
                await approvePayout(adminToken, withdrawal.id);
            }
        } else {
            console.log('⚠️ Insufficient balance for payout test (Need > ₹1000)');
        }

        // Final Report
        const totalDuration = Date.now() - totalStartTime;

        console.log('\n');
        console.log('╔═══════════════════════════════════════════════════╗');
        console.log('║              STRESS TEST COMPLETE                 ║');
        console.log('╠═══════════════════════════════════════════════════╣');
        console.log(`║  Total Time: ${(totalDuration / 1000).toFixed(2)}s                              ║`);
        console.log(`║  Users Created: ${report.usersCreated}                                ║`);
        console.log(`║  Purchases Made: ${report.purchasesMade}                              ║`);
        console.log(`║  Payouts Requested: ${report.payoutsRequested}                        ║`);
        console.log(`║  Payouts Approved: ${report.payoutsApproved}                          ║`);
        console.log(`║  Failures: ${report.failures.length}                                   ║`);
        console.log('╚═══════════════════════════════════════════════════╝');

        if (report.failures.length > 0) {
            console.log('\n❌ Failures:');
            report.failures.slice(0, 10).forEach((f, i) => { // Limit log
                console.log(`   ${i + 1}. ${f.action} - ${f.user}: ${f.error}`);
            });
            if (report.failures.length > 10) console.log(`   ...and ${report.failures.length - 10} more.`);
        }

    } catch (error) {
        console.error('\n💥 Fatal error:', error.message);
        process.exit(1);
    }
}

// Run the test
runStressTest().then(() => {
    console.log('\n✨ Test script finished');
    process.exit(0);
}).catch(err => {
    console.error('💥 Test failed:', err);
    process.exit(1);
});
