/**
 * Structured logging to stdout/stderr.
 *
 * Previously this module built a brand-new winston logger (with a new File
 * transport, i.e. a new fd) on EVERY call, or fell back to a blocking
 * fs.appendFileSync into an unrotated backend/worker.log shared by both cluster
 * processes. Under an error storm that was an fd leak and an event-loop stall.
 *
 * Now: one line per call, written to stdout/stderr, captured by PM2 and rotated
 * by pm2-logrotate. No file handles, no sync I/O, nothing to grow unbounded.
 */

function emit(stream, level, msg, meta) {
    let line;
    try {
        line = JSON.stringify({ level, message: msg, meta, ts: new Date().toISOString() });
    } catch (e) {
        // meta had a circular ref or a BigInt — never let logging throw.
        line = JSON.stringify({ level, message: msg, meta: '[unserializable]', ts: new Date().toISOString() });
    }
    stream.write(line + '\n');
}

function info(msg, meta) { emit(process.stdout, 'info', msg, meta); }
function error(msg, meta) { emit(process.stderr, 'error', msg, meta); }

/**
 * Collapses a repeating log line to at most one emission per window.
 *
 * This is what stops a dead Redis connection from writing ~1GB of identical
 * stack traces (which is exactly what filled the prod disk during the outage).
 * Suppressed occurrences are counted and reported on the next emission.
 */
const RATE_LIMIT_MS = Number(process.env.LOG_RATE_LIMIT_MS || 30000);
const seen = new Map(); // key -> { last, suppressed }

function rateLimited(key, msg, meta) {
    const now = Date.now();
    const entry = seen.get(key) || { last: 0, suppressed: 0 };

    if (now - entry.last < RATE_LIMIT_MS) {
        entry.suppressed++;
        seen.set(key, entry);
        return false;
    }

    const suppressed = entry.suppressed;
    seen.set(key, { last: now, suppressed: 0 });
    error(msg, suppressed > 0 ? { ...meta, suppressedSince: suppressed } : meta);
    return true;
}

module.exports = { info, error, rateLimited };
