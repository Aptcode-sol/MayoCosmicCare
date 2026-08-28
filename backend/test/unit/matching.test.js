const test = require('node:test');
const assert = require('node:assert/strict');
const { calculate1to1TailMatching } = require('../../src/services/matchingMath');

/**
 * Regression guard for the compensation formula.
 *
 * This is 1:1 TAIL matching, NOT plain 1:1 and NOT the 2:1/1:2 model described
 * in the stale Plan.txt. A spare "tail" member must remain on at least one leg.
 * If someone "simplifies" this to min(left, right), the equal-leg cases below fail.
 */

test('1:1 tail matching — known cases', () => {
    const cases = [
        // [left, right, expectedPairs]
        [0, 0, 0],
        [1, 0, 0],
        [0, 1, 0],
        [1, 1, 0],   // equal, no tail available -> no pair
        [2, 1, 1],
        [1, 2, 1],
        [2, 2, 1],   // equal -> count-1, leaves 1/1 as tail
        [3, 3, 2],
        [5, 5, 4],
        [10, 10, 9],
        [5, 3, 3],
        [3, 5, 3],
        [5, 2, 2],
        [100, 7, 7],
        [1, 10, 1]
    ];

    for (const [l, r, expected] of cases) {
        assert.equal(
            calculate1to1TailMatching(l, r).totalMatches,
            expected,
            `left=${l} right=${r}`
        );
    }
});

test('a tail member always remains whenever pairs are paid', () => {
    for (let l = 0; l <= 50; l++) {
        for (let r = 0; r <= 50; r++) {
            const x = calculate1to1TailMatching(l, r);
            if (x.totalMatches > 0) {
                assert.ok(
                    x.carryLeft + x.carryRight >= 1,
                    `left=${l} right=${r} paid ${x.totalMatches} pairs but left no tail`
                );
            }
        }
    }
});

test('invariants hold across the grid', () => {
    for (let l = 0; l <= 50; l++) {
        for (let r = 0; r <= 50; r++) {
            const x = calculate1to1TailMatching(l, r);
            const ctx = `left=${l} right=${r}`;

            // members are conserved on each leg
            assert.equal(x.leftConsumed + x.carryLeft, l, `${ctx}: left not conserved`);
            assert.equal(x.rightConsumed + x.carryRight, r, `${ctx}: right not conserved`);

            // a pair consumes exactly one from each leg
            assert.equal(x.membersConsumed, 2 * x.totalMatches, `${ctx}: membersConsumed`);
            assert.equal(x.leftConsumed, x.totalMatches, `${ctx}: leftConsumed`);
            assert.equal(x.rightConsumed, x.totalMatches, `${ctx}: rightConsumed`);

            // never over-pay: this is what catches a revert to the 2:1/1:2 math
            assert.ok(x.totalMatches <= Math.min(l, r), `${ctx}: over-paid`);
            assert.ok(x.totalMatches >= 0, `${ctx}: negative pairs`);
            assert.ok(x.carryLeft >= 0 && x.carryRight >= 0, `${ctx}: negative carry`);

            // the formula itself
            const expected = (l > 0 && r > 0)
                ? (l === r ? Math.max(0, l - 1) : Math.min(l, r))
                : 0;
            assert.equal(x.totalMatches, expected, `${ctx}: formula`);
        }
    }
});

test('matchType reflects whether anything matched', () => {
    assert.equal(calculate1to1TailMatching(3, 2).matchType, '1:1');
    assert.equal(calculate1to1TailMatching(1, 1).matchType, 'none');
    assert.equal(calculate1to1TailMatching(0, 5).matchType, 'none');
});

test('carry-forward accumulates correctly across sequential runs', () => {
    // Simulates the real incremental flow: members trickle in and matching runs
    // repeatedly. Cumulative pairs must equal the single-shot batch result.
    let carryL = 0, carryR = 0, cumulative = 0;
    const arrivals = ['L', 'R', 'L', 'L', 'R', 'L', 'R', 'R', 'L', 'L', 'R', 'L'];
    let arrivedL = 0, arrivedR = 0;

    for (const leg of arrivals) {
        if (leg === 'L') { carryL++; arrivedL++; } else { carryR++; arrivedR++; }
        const x = calculate1to1TailMatching(carryL, carryR);
        cumulative += x.totalMatches;
        carryL = x.carryLeft;
        carryR = x.carryRight;
    }

    const batch = arrivedL === arrivedR
        ? Math.max(0, arrivedL - 1)
        : Math.min(arrivedL, arrivedR);

    assert.equal(cumulative, batch, 'incremental matching must equal batch matching');
    assert.equal(arrivedL - cumulative, carryL, 'left carry must reconcile');
    assert.equal(arrivedR - cumulative, carryR, 'right carry must reconcile');
});
