/**
 * MLM Backend Stress Test via HTTP Requests
 * Simulates frontend requests to test the backend API
 * Creates 60 users (30 left, 30 right) with binary tree structure
 * Each user purchases a mattress through the API
 */

const BASE_URL = 'http://localhost:4000/api';
const PRODUCT_ID = 'cmjjuavwu000345zrbrzkm8kb'; // Mattress product ID

// Admin credentials
const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = 'Admin@2';

// Test stats
const report = {
    usersCreated: 0,
    purchasesMade: 0,
    failures: [],
    timeline: []
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
        return result.tokens.accessToken;
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

async function registerUser(username, email, phone, password, sponsorId, leg) {
    const startTime = Date.now();
    try {
        console.log(`📝 Registering user: ${username} (sponsor: ${sponsorId?.substring(0, 8)}... leg: ${leg})`);

        const result = await httpRequest('/auth/register', 'POST', {
            username,
            email,
            password,
            sponsorId,
            leg
        });

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

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runStressTest() {
    console.log('╔═══════════════════════════════════════════════════╗');
    console.log('║     MLM Backend Stress Test via HTTP Requests     ║');
    console.log('╠═══════════════════════════════════════════════════╣');
    console.log('║  60 users (30 left, 30 right)                     ║');
    console.log('║  Sequential registration + purchase               ║');
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

        // Step 2: Admin makes first purchase (to enable referrals)
        console.log('\n📦 Admin making initial purchase to enable referrals...');
        try {
            await purchaseProduct(adminToken, dynamicProductId, 'admin');
        } catch (e) {
            console.log('ℹ️ Admin may have already purchased (continuing...)');
        }

        // Step 3: Create 30 users on LEFT side
        console.log('\n═══════════════════════════════════════════════════');
        console.log('   Creating 30 users on LEFT side');
        console.log('═══════════════════════════════════════════════════\n');

        // Step 3: Create 'sanket' user (Root of the tree)
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
                // We need the ID, so fetch me
                const me = await httpRequest('/auth/me', 'GET', null, token);
                sanketUser = me.user || me;
                sanketUser.token = token;
                console.log(`✅ Loaded existing sanket user (ID: ${sanketUser.id})`);
                await purchaseProduct(token, dynamicProductId, 'sanket').catch(() => { });
            } catch (err) {
                throw new Error('Could not create or login sanket user: ' + err.message);
            }
        }

        // Step 4: Generate 60 users in a binary tree structure (30 left sub-tree, 30 right sub-tree)
        // BFS Queue approach to ensure balanced filling
        console.log('\n═══════════════════════════════════════════════════');
        console.log('   Generating Binary Tree (60 Users)');
        console.log('═══════════════════════════════════════════════════\n');

        const queue = [sanketUser]; // Queue of users who need children
        let usersCreatedCount = 0;
        const TOTAl_USERS_TO_CREATE = 200; // 100 left side + 100 right side

        while (usersCreatedCount < TOTAl_USERS_TO_CREATE && queue.length > 0) {
            const parent = queue.shift();

            // Try to add Left Child
            if (usersCreatedCount < TOTAl_USERS_TO_CREATE) {
                usersCreatedCount++;
                const username = `user_${usersCreatedCount}`;
                const email = `user${usersCreatedCount}@test.com`;
                const password = 'Test@123';
                const phone = `80000000${usersCreatedCount.toString().padStart(2, '0')}`;

                try {
                    const user = await registerUser(username, email, phone, password, parent.id, 'left');
                    await delay(50); // Short delay
                    const token = await loginUser(email, password);
                    await purchaseProduct(token, dynamicProductId, username);

                    user.token = token;
                    queue.push(user); // Add to queue to become a parent later
                } catch (err) {
                    console.error(`⚠️ Failed to add left child for ${parent.username}`);
                }
            }

            // Try to add Right Child
            if (usersCreatedCount < TOTAl_USERS_TO_CREATE) {
                usersCreatedCount++;
                const username = `user_${usersCreatedCount}`;
                const email = `user${usersCreatedCount}@test.com`;
                const password = 'Test@123';
                const phone = `90000000${usersCreatedCount.toString().padStart(2, '0')}`;

                try {
                    const user = await registerUser(username, email, phone, password, parent.id, 'right');
                    await delay(50);
                    const token = await loginUser(email, password);
                    await purchaseProduct(token, dynamicProductId, username);

                    user.token = token;
                    queue.push(user);
                } catch (err) {
                    console.error(`⚠️ Failed to add right child for ${parent.username}`);
                }
            }
        }

        // Final report
        const totalDuration = Date.now() - totalStartTime;

        console.log('\n');
        console.log('╔═══════════════════════════════════════════════════╗');
        console.log('║              STRESS TEST COMPLETE                 ║');
        console.log('╠═══════════════════════════════════════════════════╣');
        console.log(`║  Total Time: ${(totalDuration / 1000).toFixed(2)}s                              ║`);
        console.log(`║  Users Created: ${report.usersCreated}/60                            ║`);
        console.log(`║  Purchases Made: ${report.purchasesMade}                              ║`);
        console.log(`║  Failures: ${report.failures.length}                                   ║`);
        console.log('╚═══════════════════════════════════════════════════╝');

        if (report.failures.length > 0) {
            console.log('\n❌ Failures:');
            report.failures.forEach((f, i) => {
                console.log(`   ${i + 1}. ${f.action} - ${f.user}: ${f.error}`);
            });
        }

        // Performance stats
        const registerTimes = report.timeline.filter(t => t.action === 'register' && t.success).map(t => t.duration);
        const purchaseTimes = report.timeline.filter(t => t.action === 'purchase' && t.success).map(t => t.duration);

        if (registerTimes.length > 0) {
            const avgRegister = registerTimes.reduce((a, b) => a + b, 0) / registerTimes.length;
            console.log(`\n📊 Avg Registration Time: ${avgRegister.toFixed(0)}ms`);
        }

        if (purchaseTimes.length > 0) {
            const avgPurchase = purchaseTimes.reduce((a, b) => a + b, 0) / purchaseTimes.length;
            console.log(`📊 Avg Purchase Time: ${avgPurchase.toFixed(0)}ms`);
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
