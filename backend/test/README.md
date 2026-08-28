# Tests

## Unit tests — `npm test`

No database, no Redis, no `npm install` required beyond the repo's own deps.
Covers the pure helpers in `src/services/matchingMath.js`:

- **the matching formula** — 1:1 **tail** binary (`pairs = left===right ? left-1 : min(left,right)`).
  A spare "tail" member must remain on at least one leg. This is the regression
  guard against someone "simplifying" it to `min(left, right)` or reverting to the
  stale 2:1/1:2 model still described in `Plan.txt`.
- rank thresholds, both sides of every boundary
- IST day bounds, which must be identical regardless of the host's `TZ`

## Integration tests — `npm run test:integration`

Needs a real Postgres. `helpers.js` refuses to run unless `DATABASE_URL` looks
like a throwaway (`mlm_test`, `_test`, localhost) — these tests `TRUNCATE` every
table.

```bash
# one-time
brew install postgresql@15
export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"
pg_ctl -D /opt/homebrew/var/postgresql@15 -o "-p 5433" -l /tmp/pg.log start
createdb -p 5433 mlm_test

# each run
export DATABASE_URL="postgresql://$(whoami)@127.0.0.1:5433/mlm_test?schema=public"
export DIRECT_URL="$DATABASE_URL"
npx prisma db push --skip-generate     # NOT migrate deploy — see below
export MATCHING_BONUS_PER_MATCH=700 DAILY_PAIR_CAP=10 \
       LEADERSHIP_BONUS_PERCENT=10 DAILY_LEADERSHIP_BONUS_CAP=5000 \
       DIRECT_BONUS_AMOUNT=500 REDIS_ENABLED=false
npm run test:integration
```

> **Use `db push`, not `migrate deploy`.** The committed migrations are behind
> `schema.prisma` (`User.kycMessage` exists in the schema but in no migration),
> because production has been built with `db push`. `migrate deploy` produces a
> database the Prisma client cannot query. Worth reconciling separately.

### What they cover, and why

| File | Guards |
|---|---|
| `concurrency.test.js` | **10 concurrent payouts must produce exactly one.** Verified against the pre-fix code: it paid **9 times, ₹18,900 instead of ₹2,100**. |
| `atomicity.test.js` | Injected mid-transaction failures roll back completely — wallet, payout record, counters, member counts. Also asserts that passing the root client (the original bug) throws instead of silently running unlocked. |
| `payout.test.js` | Happy path, the equal-leg tail rule, eligibility gate, carry-forward reuse, daily cap, leadership bonus, rank promotion. The carry-forward case deliberately forces a **second** payout in the same day, exercising the counter's `upsert` UPDATE branch — the path that would break if anyone reintroduces `create`-then-catch-`P2002` inside a transaction. |
| `purchase.test.js` | Direct bonus is first-purchase-only; BV survives concurrent purchases. |

### A note on the BV concurrency fixture

`purchase.test.js` gives each buyer a **distinct product and a distinct sponsor**,
sharing only the placement parent. That is not incidental. Any row two purchases
share serialises their transactions and hides the race:

- a shared product serialises on the stock `updateMany` row lock
- a shared sponsor serialises on that sponsor's wallet `upsert`

With either of those in the fixture, the old read-modify-write code **passes** and
the test is worthless. With both removed it fails correctly (BV 100 instead of
250, 3 of 5 increments lost). If you touch this fixture, re-verify it still fails
against the old code.
