const test = require('node:test');
const assert = require('node:assert/strict');
const { istDayBounds } = require('../../src/services/matchingMath');

/**
 * The daily pair cap is keyed on these bounds. If the API processes and the
 * worker process disagree on where "today" starts, they write two
 * DailyPairCounter rows for the same day (the @@unique([userId, date]) does not
 * collide) and the effective cap doubles. So the bounds must not depend on the
 * host's TZ.
 */

function withTZ(tz, fn) {
    const prev = process.env.TZ;
    process.env.TZ = tz;
    try { return fn(); } finally {
        if (prev === undefined) delete process.env.TZ; else process.env.TZ = prev;
    }
}

test('bounds are identical under UTC and IST hosts', () => {
    const samples = [
        new Date('2026-08-28T17:12:33Z'),  // IST 22:42 same day
        new Date('2026-08-28T19:30:00Z'),  // IST 01:00 NEXT day — the boundary case
        new Date('2026-08-28T18:29:59Z'),  // IST 23:59:59 same day
        new Date('2026-01-01T00:00:00Z'),
        new Date('2026-12-31T23:59:59Z')
    ];

    for (const now of samples) {
        const utc = withTZ('UTC', () => istDayBounds(now));
        const ist = withTZ('Asia/Kolkata', () => istDayBounds(now));
        const ny = withTZ('America/New_York', () => istDayBounds(now));

        assert.equal(
            utc.todayStart.toISOString(), ist.todayStart.toISOString(),
            `todayStart diverged UTC vs IST for ${now.toISOString()}`
        );
        assert.equal(
            utc.todayStart.toISOString(), ny.todayStart.toISOString(),
            `todayStart diverged UTC vs New_York for ${now.toISOString()}`
        );
        assert.equal(utc.todayEnd.toISOString(), ist.todayEnd.toISOString());
    }
});

test('the window is exactly 24 hours and contains no time component', () => {
    const { todayStart, todayEnd } = istDayBounds(new Date('2026-08-28T17:12:33Z'));
    assert.equal(todayEnd - todayStart, 24 * 60 * 60 * 1000);
    assert.equal(todayStart.toISOString().slice(10), 'T00:00:00.000Z');
});

test('rolls over at IST midnight, not UTC midnight', () => {
    // 18:29:59Z is 23:59:59 IST on the 28th; 18:30:00Z is 00:00 IST on the 29th.
    const before = istDayBounds(new Date('2026-08-28T18:29:59Z'));
    const after = istDayBounds(new Date('2026-08-28T18:30:00Z'));
    assert.equal(before.todayStart.toISOString().slice(0, 10), '2026-08-28');
    assert.equal(after.todayStart.toISOString().slice(0, 10), '2026-08-29');
});

test('matches what production currently stores (UTC host, Date.UTC form)', () => {
    // Guards the refactor: prod runs TZ-unset (UTC), where the old
    // `new Date(y, m, d)` produced exactly this instant.
    const { todayStart } = withTZ('UTC', () => istDayBounds(new Date('2026-08-28T17:12:33Z')));
    assert.equal(todayStart.toISOString(), '2026-08-28T00:00:00.000Z');
});
