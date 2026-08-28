/**
 * Pure, dependency-free helpers for the matching/commission engine.
 *
 * Deliberately imports nothing: this module is unit-testable without a database,
 * Redis, or even an `npm install`. Anything here must stay a pure function.
 */

/** Rank thresholds, highest first. Sourced from the compensation plan. */
const RANKS = [
    [50000, 'National Director'],
    [20000, 'Director'],
    [10000, 'Regional Manager'],
    [5000, 'Senior Manager'],
    [1000, 'Manager'],
    [300, 'Assistant Manager'],
    [150, 'Senior Team Leader'],
    [100, 'Team Leader'],
    [50, 'Senior Associate'],
    [15, 'Associate Executive']
];

/**
 * 1:1 TAIL binary matching.
 *
 * A pair consumes 1 left + 1 right, but the plan also requires a spare "tail"
 * member to remain on at least one leg. So when both legs are equal we pay
 * count-1 pairs rather than count; when they differ the shorter leg already
 * guarantees the longer one keeps a tail.
 *
 *   pairs = left === right ? left - 1 : min(left, right)
 *
 * Leftovers carry forward; nothing is flushed.
 */
function calculate1to1TailMatching(leftCount, rightCount) {
    const left = leftCount;
    const right = rightCount;

    let totalMatches = 0;
    if (left > 0 && right > 0) {
        totalMatches = left === right
            ? Math.max(0, left - 1)
            : Math.min(left, right);
    }

    const leftConsumed = totalMatches;
    const rightConsumed = totalMatches;

    return {
        totalMatches,
        membersConsumed: totalMatches * 2,
        leftConsumed,
        rightConsumed,
        carryLeft: left - leftConsumed,
        carryRight: right - rightConsumed,
        matchType: totalMatches > 0 ? '1:1' : 'none'
    };
}

/** Rank for a cumulative pair count. */
function rankForPairs(totalPairs) {
    for (const [threshold, rank] of RANKS) {
        if (totalPairs >= threshold) return rank;
    }
    return 'Rookie';
}

/**
 * Start/end of "today" in IST, as absolute instants.
 *
 * Returns UTC midnight of the current IST calendar date. Using Date.UTC rather
 * than `new Date(y, m, d)` makes this independent of the server's TZ: the old
 * form silently produced a different instant on an IST-configured host than on
 * a UTC one, which would create two DailyPairCounter rows for the same day and
 * double the effective daily cap. Production runs UTC, so this preserves every
 * existing stored value.
 */
function istDayBounds(now = new Date()) {
    const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const y = ist.getFullYear();
    const m = ist.getMonth();
    const d = ist.getDate();
    return {
        todayStart: new Date(Date.UTC(y, m, d)),
        todayEnd: new Date(Date.UTC(y, m, d + 1))
    };
}

module.exports = { calculate1to1TailMatching, rankForPairs, istDayBounds, RANKS };
