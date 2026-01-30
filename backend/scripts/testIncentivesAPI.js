/**
 * Test Incentives API
 */

const BASE_URL = 'http://localhost:4000/api';
const TEST_OTP = '123456';

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
        throw new Error(data.error || data.errors?.name || JSON.stringify(data));
    }
    return data;
}

async function run() {
    try {
        console.log('\n╔═══════════════════════════════════════════════════════════╗');
        console.log('║            Testing /api/dashboard/incentives              ║');
        console.log('╚═══════════════════════════════════════════════════════════╝\n');

        // Login as Sanket
        console.log('🔐 Logging in as Sanket...');
        const loginRes = await http('/auth/login', 'POST', {
            email: 'sanket@gmail.com',
            password: 'Sanket@123'
        });
        const token = loginRes.tokens.accessToken;
        console.log('✅ Logged in\n');

        // Get incentives
        console.log('📊 Fetching incentives...');
        const incentives = await http('/dashboard/incentives', 'GET', null, token);

        console.log('✅ Response received!\n');

        if (incentives.ok && incentives.data) {
            const summary = incentives.data.summary;
            console.log('SUMMARY:');
            console.log(`  Total Paid: ₹${(summary.totalPaid || 0).toLocaleString()}`);
            console.log(`  Direct Bonus: ₹${(summary.directBonus || 0).toLocaleString()}`);
            console.log(`  Matching Bonus: ₹${(summary.matchingBonus || 0).toLocaleString()}`);
            console.log(`  Leadership Bonus: ₹${(summary.leadershipBonus || 0).toLocaleString()}\n`);

            console.log('TODAY:');
            console.log(`  Today Matching Bonus: ₹${(summary.todayMatchingBonus || 0).toLocaleString()} / ₹${summary.matchingDailyCap}`);
            console.log(`  Today Leadership Bonus: ₹${(summary.todayLeadershipBonus || 0).toLocaleString()} / ₹${summary.leadershipDailyCap}`);
            console.log(`  Today Pairs: ${summary.todayPairs} / ${summary.dailyPairCap}\n`);

            const history = incentives.data.history || [];
            console.log(`HISTORY (${history.length} transactions):`);
            for (let i = 0; i < Math.min(5, history.length); i++) {
                const tx = history[i];
                console.log(`  ${tx.type.padEnd(20)} ₹${tx.amount.toString().padStart(8)} - ${tx.detail}`);
            }
            console.log('');
        } else {
            console.log('❌ Unexpected response format');
            console.log(JSON.stringify(incentives, null, 2));
        }

    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

run();
