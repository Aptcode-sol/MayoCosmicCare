const { PrismaClient } = require('@prisma/client');
(async function () {
    const prisma = new PrismaClient();
    try {
        const u = await prisma.user.findUnique({ where: { email: 'admin@gmail.com' } });
        console.log(u ? u.id : 'NO_ADMIN');
    } catch (e) {
        console.error(e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
})();
