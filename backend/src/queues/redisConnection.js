const IORedis = require('ioredis');
const { rateLimited } = require('../logger');

/**
 * Shared ioredis factories.
 *
 * Producers and workers need DIFFERENT options and getting this wrong caused a
 * 7-week silent outage, so the two are separated here rather than copy-pasted.
 *
 * The rule that matters: never let retryStrategy return null. Returning null
 * tells ioredis to stop reconnecting *permanently*, so a single ElastiCache
 * failover killed the matching worker until someone restarted the process.
 */

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

/** Exponential-ish backoff, capped. Never returns null — that is the whole point. */
function retryStrategy(times) {
    return Math.min(times * 200, 5000);
}

/** ElastiCache/Valkey promotes a replica on failover; reconnect rather than error out. */
function reconnectOnError(err) {
    return err.message.includes('READONLY');
}

function attachHandlers(client, label) {
    client.on('error', (err) => {
        rateLimited(`redis:${label}`, 'redis_connection_error', { label, err: err.message });
    });
    return client;
}

/**
 * For BullMQ Workers.
 *
 * maxRetriesPerRequest MUST be null here: BullMQ workers issue blocking commands
 * (BRPOPLPUSH) that would otherwise be aborted. Do not "harden" this to a number.
 */
function workerConnection(label = 'worker') {
    return attachHandlers(new IORedis(REDIS_URL, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        retryStrategy,
        reconnectOnError
    }), label);
}

/**
 * For Queue producers (.add()).
 *
 * enableOfflineQueue:false stops ioredis buffering commands forever while
 * disconnected. NOTE (measured, not assumed): this is necessary but NOT
 * sufficient — BullMQ v1's Queue awaits its own connection-readiness gate
 * before issuing the command, so `.add()` still hangs indefinitely with Redis
 * down even with this set. The actual protection is the withTimeout() wrapper
 * in queue.js; keep both.
 */
function producerConnection(label = 'producer') {
    return attachHandlers(new IORedis(REDIS_URL, {
        maxRetriesPerRequest: 2,
        enableOfflineQueue: false,
        connectTimeout: 5000,
        commandTimeout: 5000,
        retryStrategy,
        reconnectOnError
    }), label);
}

module.exports = { workerConnection, producerConnection, retryStrategy, REDIS_URL };
