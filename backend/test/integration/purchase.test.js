const test = require('node:test');
const assert = require('node:assert/strict');
const { prisma, resetDb, uid } = require('./helpers');
const { purchaseProduct } = require('../../src/services/purchaseService');

const DIRECT = parseInt(process.env.DIRECT_BONUS_AMOUNT || '500', 10);

async function makeProduct({ bv = 50, price = 15000, stock = 100 } = {}) {
    return prisma.product.create({
        data: { name: uid('prod'), price, bv, stock }
    });
}

/** A user already placed in the tree, so purchaseProduct skips placement. */
async function placedUser({ sponsorId = null, parentId = null, position = null } = {}) {
    const id = uid('p');
    const u = await prisma.user.create({
        data: {
            id, username: uid('pn'), email: `${id}@test.local`, password: 'x',
            sponsorId, parentId, position, hasPurchased: false
        }
    });
    await prisma.wallet.create({ data: { userId: id, balance: 0 } });
    return u;
}

test.after(async () => { await prisma.$disconnect(); });

test('first purchase credits the sponsor a direct bonus exactly once', async () => {
    await resetDb();
    const product = await makeProduct();
    const sponsor = await placedUser();
    await prisma.user.update({ where: { id: sponsor.id }, data: { hasPurchased: true, position: 'ROOT' } });
    const buyer = await placedUser({ sponsorId: sponsor.id, parentId: sponsor.id, position: 'LEFT' });

    await purchaseProduct(buyer.id, product.id);

    const sw = await prisma.wallet.findUnique({ where: { userId: sponsor.id } });
    assert.equal(sw.balance, DIRECT, 'sponsor got the direct bonus');

    const direct = await prisma.transaction.findMany({
        where: { userId: sponsor.id, type: 'DIRECT_BONUS' }
    });
    assert.equal(direct.length, 1);

    const b = await prisma.user.findUnique({ where: { id: buyer.id } });
    assert.equal(b.hasPurchased, true);

    // BV and member count propagated to the upline
    const s = await prisma.user.findUnique({ where: { id: sponsor.id } });
    assert.equal(s.leftBV, product.bv);
    assert.equal(s.leftMemberCount, 1);
});

test('a second purchase does not credit the direct bonus again', async () => {
    await resetDb();
    const product = await makeProduct();
    const sponsor = await placedUser();
    await prisma.user.update({ where: { id: sponsor.id }, data: { hasPurchased: true, position: 'ROOT' } });
    const buyer = await placedUser({ sponsorId: sponsor.id, parentId: sponsor.id, position: 'LEFT' });

    await purchaseProduct(buyer.id, product.id);
    await purchaseProduct(buyer.id, product.id);

    const direct = await prisma.transaction.findMany({
        where: { userId: sponsor.id, type: 'DIRECT_BONUS' }
    });
    assert.equal(direct.length, 1, 'direct bonus is first-purchase only');

    const s = await prisma.user.findUnique({ where: { id: sponsor.id } });
    assert.equal(s.leftBV, product.bv * 2, 'BV accrues on every purchase');
    assert.equal(s.leftMemberCount, 1, 'member count only on the first');
});

/**
 * Regression guard for the BV lost update.
 *
 * purchaseService used to write `leftBV = parent.leftBV + product.bv`, a
 * read-modify-write. Two concurrent purchases sharing an upline both read the
 * same value and the second overwrote the first, silently losing BV. The
 * adjacent member-count line was already using an atomic increment.
 */
test('concurrent purchases under a shared upline do not lose BV', async () => {
    await resetDb();
    const root = await placedUser();
    await prisma.user.update({ where: { id: root.id }, data: { hasPurchased: true, position: 'ROOT' } });

    // Every shared row between two purchases serialises them and hides this race,
    // so the fixture has to avoid all of them:
    //   - a shared PRODUCT serialises on the stock updateMany's row lock
    //   - a shared SPONSOR serialises on that sponsor's wallet upsert
    // Hence: distinct product and distinct sponsor per buyer, with only the
    // placement parent shared. That is also the real production shape, since
    // sponsorId (referrer) and parentId (placement) are deliberately different.
    const N = 5;
    const BV = 50;
    const buyers = [];
    const products = [];
    for (let i = 0; i < N; i++) {
        products.push(await makeProduct({ bv: BV, stock: 10 }));
        const sponsor = await placedUser();
        await prisma.user.update({ where: { id: sponsor.id }, data: { hasPurchased: true } });
        buyers.push(await placedUser({ sponsorId: sponsor.id, parentId: root.id, position: 'LEFT' }));
    }

    const results = await Promise.all(
        buyers.map((b, i) => purchaseProduct(b.id, products[i].id).catch((e) => e))
    );
    const errs = results.filter((r) => r instanceof Error);
    assert.deepEqual(errs.map((e) => e.message), [], 'all purchases succeeded');

    const s = await prisma.user.findUnique({ where: { id: root.id } });
    assert.equal(s.leftBV, BV * N, `all ${N} BV increments landed (lost-update guard)`);
    assert.equal(s.leftMemberCount, N, `all ${N} member increments landed`);
});

test('out of stock is rejected and nothing is credited', async () => {
    await resetDb();
    const product = await makeProduct({ stock: 0 });
    const sponsor = await placedUser();
    await prisma.user.update({ where: { id: sponsor.id }, data: { hasPurchased: true, position: 'ROOT' } });
    const buyer = await placedUser({ sponsorId: sponsor.id, parentId: sponsor.id, position: 'LEFT' });

    await assert.rejects(() => purchaseProduct(buyer.id, product.id), /stock/i);

    const sw = await prisma.wallet.findUnique({ where: { userId: sponsor.id } });
    assert.equal(sw.balance, 0, 'no bonus on a failed purchase');
    const b = await prisma.user.findUnique({ where: { id: buyer.id } });
    assert.equal(b.hasPurchased, false);
});
