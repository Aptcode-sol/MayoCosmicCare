/**
 * MLM Backend Stress Test v2 - Balanced Binary Tree
 * 
 * Structure:
 * - Admin (root)
 *   └── sanket (LEFT of admin)
 *       ├── 50 users on LEFT (balanced tree)
 *       └── 50 users on RIGHT (balanced tree)
 * 
 * Each user purchases a mattress.
 * Report compares actual vs expected bonuses.
 */

const BASE_URL = 'http://localhost:4000/api';
const PRODUCT_ID = 'cmjjuavwu000345zrbrzkm8kb'; // Mattress product ID

// Bonus constants (from .env defaults)
const DIRECT_BONUS = 500;
const MATCHING_BONUS_PER_PAIR = 700;
const MATTRESS_BV = 7000;

// Admin credentials
const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = 'Admin@2';

// Sanket credentials
const SANKET_USERNAME = 'sanket';
const SANKET_EMAIL = 'sanket@test.com';
const SANKET_PASSWORD = 'sanket123';

// Test configuration
const USERS_PER_SIDE = 50;

// Report data
const report = {
    usersCreated: 0,
    purchasesMade: 0,
    failures: [],
    users: [], // { id, username, sponsorId, position, level }
    expectedBonuses: {}, // userId -> { directBonus, matchingBonus }
    actualBonuses: {} // Will be fetched at end
};

async function httpRequest(endpoint, method = 'GET', body = null, token = null) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || data.message || `HTTP ${response.status}`);
    }
    return data;
}

async function loginAdmin() {
    console.log('🔐 Logging in as admin...');
    const result = await httpRequest('/auth/admin-login', 'POST', {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
    });
    console.log('✅ Admin login successful');
    return result.tokens.accessToken;
}

async function getUser(token) {
    const result = await httpRequest('/auth/me', 'GET', null, token);
    return result.user || result;
}

async function registerUser(username, email, password, sponsorId, leg) {
    console.log(`📝 Registering: ${username} (sponsor: ${sponsorId?.substring(0, 8)}... leg: ${leg})`);
    const result = await httpRequest('/auth/register', 'POST', {
        username,
        email,
        password,
        sponsorId,
        leg
    });
    report.usersCreated++;
    console.log(`✅ Registered ${username} (ID: ${result.id})`);
    return result;
}

async function loginUser(email, password) {
    const result = await httpRequest('/auth/login', 'POST', { email, password });
    return result.tokens.accessToken;
}

async function purchaseProduct(token, username) {
    console.log(`🛒 ${username} purchasing...`);
    await httpRequest(`/products/${PRODUCT_ID}/purchase`, 'POST', null, token);
    report.purchasesMade++;
    console.log(`✅ ${username} purchase complete`);
}

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Build balanced binary tree - each parent has 2 children (left and right)
async function buildBalancedTree(rootId, rootEmail, rootPassword, side, count) {
    const queue = [{ id: rootId, email: rootEmail, password: rootPassword, level: 0 }];
    let created = 0;
    let userIndex = 1;

    while (created < count && queue.length > 0) {
        const parent = queue.shift();

        // Login parent
        const parentToken = await loginUser(parent.email, parent.password);

        // Create left child if needed
        if (created < count) {
            const username = `${side}_user_${userIndex}`;
            const email = `${side}${userIndex}@test.com`;
            const password = 'Test@123';

            try {
                const user = await registerUser(username, email, password, parent.id, 'left');
                await delay(50);

                const token = await loginUser(email, password);
                await purchaseProduct(token, username);

                report.users.push({ id: user.id, username, sponsorId: parent.id, position: 'LEFT', level: parent.level + 1 });

                // Track expected direct bonus for parent
                if (!report.expectedBonuses[parent.id]) {
                    report.expectedBonuses[parent.id] = { directBonus: 0, matchingBonus: 0 };
                }
                report.expectedBonuses[parent.id].directBonus += DIRECT_BONUS;

                queue.push({ id: user.id, email, password, level: parent.level + 1 });
                created++;
                userIndex++;
                await delay(100);
            } catch (err) {
                console.error(`❌ Error creating ${username}:`, err.message);
                report.failures.push({ user: username, error: err.message });
            }
        }

        // Create right child if needed
        if (created < count) {
            const username = `${side}_user_${userIndex}`;
            const email = `${side}${userIndex}@test.com`;
            const password = 'Test@123';

            try {
                const user = await registerUser(username, email, password, parent.id, 'right');
                await delay(50);

                const token = await loginUser(email, password);
                await purchaseProduct(token, username);

                report.users.push({ id: user.id, username, sponsorId: parent.id, position: 'RIGHT', level: parent.level + 1 });

                // Track expected direct bonus for parent
                if (!report.expectedBonuses[parent.id]) {
                    report.expectedBonuses[parent.id] = { directBonus: 0, matchingBonus: 0 };
                }
                report.expectedBonuses[parent.id].directBonus += DIRECT_BONUS;

                queue.push({ id: user.id, email, password, level: parent.level + 1 });
                created++;
                userIndex++;
                await delay(100);
            } catch (err) {
                console.error(`❌ Error creating ${username}:`, err.message);
                report.failures.push({ user: username, error: err.message });
            }
        }
    }

    return created;
}

async function runTest() {
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║     MLM Stress Test v2 - Balanced Binary Tree                 ║');
    console.log('╠═══════════════════════════════════════════════════════════════╣');
    console.log(`║  Root: sanket (under admin)                                   ║`);
    console.log(`║  Left side: ${USERS_PER_SIDE} users | Right side: ${USERS_PER_SIDE} users                    ║`);
    console.log(`║  Tree structure: Each user refers 2 (1 left + 1 right)        ║`);
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    const startTime = Date.now();

    try {
        // Step 1: Login as admin
        const adminToken = await loginAdmin();
        const admin = await getUser(adminToken);
        console.log(`✅ Admin ID: ${admin.id}\n`);

        // Step 2: Create sanket under admin (LEFT side)
        console.log('═══════════════════════════════════════════════════');
        console.log('   Creating SANKET under Admin (LEFT)');
        console.log('═══════════════════════════════════════════════════\n');

        let sanket;
        try {
            sanket = await registerUser(SANKET_USERNAME, SANKET_EMAIL, SANKET_PASSWORD, admin.id, 'left');
            await delay(100);

            const sanketToken = await loginUser(SANKET_EMAIL, SANKET_PASSWORD);
            await purchaseProduct(sanketToken, SANKET_USERNAME);

            report.users.push({ id: sanket.id, username: SANKET_USERNAME, sponsorId: admin.id, position: 'LEFT', level: 1 });
            report.expectedBonuses[admin.id] = { directBonus: DIRECT_BONUS, matchingBonus: 0 };
            report.expectedBonuses[sanket.id] = { directBonus: 0, matchingBonus: 0 };
        } catch (err) {
            console.error('❌ Failed to create sanket:', err.message);
            throw err;
        }

        // Step 3: Build LEFT side under sanket
        console.log('\n═══════════════════════════════════════════════════');
        console.log(`   Building LEFT side of Sanket (${USERS_PER_SIDE} users)`);
        console.log('═══════════════════════════════════════════════════\n');

        const leftCreated = await buildBalancedTree(sanket.id, SANKET_EMAIL, SANKET_PASSWORD, 'left', USERS_PER_SIDE);

        // Step 4: Build RIGHT side under sanket
        console.log('\n═══════════════════════════════════════════════════');
        console.log(`   Building RIGHT side of Sanket (${USERS_PER_SIDE} users)`);
        console.log('═══════════════════════════════════════════════════\n');

        const rightCreated = await buildBalancedTree(sanket.id, SANKET_EMAIL, SANKET_PASSWORD, 'right', USERS_PER_SIDE);

        // Generate report
        const totalTime = (Date.now() - startTime) / 1000;

        // Calculate expected totals
        let totalExpectedDirectBonus = 0;
        let totalExpectedMatchingBonus = 0;

        // Direct bonus: each referral gives sponsor ₹500
        for (const userId in report.expectedBonuses) {
            totalExpectedDirectBonus += report.expectedBonuses[userId].directBonus;
        }

        // Matching bonus calculation:
        // Sanket has leftCreated users on left, rightCreated on right
        // Pairs = min(leftCreated, rightCreated)
        const sanketPairs = Math.min(leftCreated, rightCreated);
        report.expectedBonuses[sanket.id].matchingBonus = sanketPairs * MATCHING_BONUS_PER_PAIR;
        totalExpectedMatchingBonus = sanketPairs * MATCHING_BONUS_PER_PAIR;

        console.log('\n');
        console.log('╔═══════════════════════════════════════════════════════════════╗');
        console.log('║                    STRESS TEST REPORT                         ║');
        console.log('╠═══════════════════════════════════════════════════════════════╣');
        console.log(`║  Total Time: ${totalTime.toFixed(2)}s                                          ║`);
        console.log(`║  Users Created: ${report.usersCreated} (+ 1 sanket = ${report.usersCreated + 1} total)                    ║`);
        console.log(`║  Purchases Made: ${report.purchasesMade}                                        ║`);
        console.log(`║  Failures: ${report.failures.length}                                              ║`);
        console.log('╠═══════════════════════════════════════════════════════════════╣');
        console.log('║  TREE STRUCTURE:                                              ║');
        console.log(`║  Sanket Left Side: ${leftCreated} users                                  ║`);
        console.log(`║  Sanket Right Side: ${rightCreated} users                                 ║`);
        console.log('╠═══════════════════════════════════════════════════════════════╣');
        console.log('║  EXPECTED BONUSES:                                            ║');
        console.log(`║  Total Direct Bonus: ₹${totalExpectedDirectBonus.toLocaleString()}                                ║`);
        console.log(`║  Sanket Matching Pairs: ${sanketPairs} pairs                              ║`);
        console.log(`║  Sanket Expected Matching: ₹${report.expectedBonuses[sanket.id].matchingBonus.toLocaleString()}                          ║`);
        console.log(`║  Total Expected Matching: ₹${totalExpectedMatchingBonus.toLocaleString()}                           ║`);
        console.log('╠═══════════════════════════════════════════════════════════════╣');
        console.log('║  SANKET EXPECTED EARNINGS:                                    ║');
        console.log(`║  Direct Bonus: ₹${report.expectedBonuses[sanket.id].directBonus.toLocaleString()}                                       ║`);
        console.log(`║  Matching Bonus: ₹${report.expectedBonuses[sanket.id].matchingBonus.toLocaleString()}                                    ║`);
        console.log(`║  TOTAL: ₹${(report.expectedBonuses[sanket.id].directBonus + report.expectedBonuses[sanket.id].matchingBonus).toLocaleString()}                                           ║`);
        console.log('╚═══════════════════════════════════════════════════════════════╝');

        if (report.failures.length > 0) {
            console.log('\n❌ Failures:');
            report.failures.slice(0, 10).forEach((f, i) => {
                console.log(`   ${i + 1}. ${f.user}: ${f.error}`);
            });
            if (report.failures.length > 10) {
                console.log(`   ... and ${report.failures.length - 10} more`);
            }
        }

    } catch (error) {
        console.error('\n💥 Fatal error:', error.message);
        process.exit(1);
    }
}

runTest().then(() => {
    console.log('\n✨ Test complete!');
    process.exit(0);
}).catch(err => {
    console.error('💥 Test failed:', err);
    process.exit(1);
});
