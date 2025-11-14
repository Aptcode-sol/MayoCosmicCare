const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const axios = require('axios');

async function run() {
    // Assumes server running and admin/product seeded. Create multiple registrations concurrently.
    const sponsor = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!sponsor) return console.log('No sponsor/admin found');
    const tasks = [];
    for (let i = 0; i < 6; i++) {
        tasks.push(axios.post('http://localhost:4000/api/auth/register', { username: 't' + Date.now() + i, email: `t${Date.now()}${i}@test`, password: 'secret123', sponsorId: sponsor.id }));
    }
    const results = await Promise.allSettled(tasks);
    console.log(results.map(r => r.status === 'fulfilled' ? r.value.data : r.reason?.message));
}

run().catch(e => console.error(e));
