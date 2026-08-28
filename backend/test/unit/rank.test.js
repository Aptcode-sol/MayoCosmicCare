const test = require('node:test');
const assert = require('node:assert/strict');
const { rankForPairs, RANKS } = require('../../src/services/matchingMath');

test('rank boundaries — both sides of every threshold', () => {
    const cases = [
        [0, 'Rookie'],
        [14, 'Rookie'],
        [15, 'Associate Executive'],
        [49, 'Associate Executive'],
        [50, 'Senior Associate'],
        [99, 'Senior Associate'],
        [100, 'Team Leader'],
        [149, 'Team Leader'],
        [150, 'Senior Team Leader'],
        [299, 'Senior Team Leader'],
        [300, 'Assistant Manager'],
        [999, 'Assistant Manager'],
        [1000, 'Manager'],
        [4999, 'Manager'],
        [5000, 'Senior Manager'],
        [9999, 'Senior Manager'],
        [10000, 'Regional Manager'],
        [19999, 'Regional Manager'],
        [20000, 'Director'],
        [49999, 'Director'],
        [50000, 'National Director'],
        [1000000, 'National Director']
    ];

    for (const [pairs, expected] of cases) {
        assert.equal(rankForPairs(pairs), expected, `pairs=${pairs}`);
    }
});

test('rank is monotonically non-decreasing as pairs grow', () => {
    const order = ['Rookie', ...[...RANKS].reverse().map(([, name]) => name)];
    let lastIndex = 0;
    for (let n = 0; n <= 60000; n += 7) {
        const idx = order.indexOf(rankForPairs(n));
        assert.ok(idx >= lastIndex, `rank went backwards at pairs=${n}`);
        lastIndex = idx;
    }
});
