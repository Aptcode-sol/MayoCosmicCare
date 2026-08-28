module.exports = {
    apps: [
        {
            name: 'backend',
            script: 'src/index.js',
            cwd: __dirname,
            instances: 2,
            exec_mode: 'cluster',

            // During the outage a dead Redis connection made BullMQ hot-loop, and
            // RSS climbed to ~476MB per instance. This alone would have recovered
            // the service automatically.
            max_memory_restart: '400M',

            // Give in-flight work a chance to finish. PM2's default is 1600ms,
            // which SIGKILLs mid-payout.
            kill_timeout: 10000,

            merge_logs: true,
            time: true,

            env: {
                NODE_ENV: 'production',
                PORT: 5000
                // NOTE: deliberately not setting TZ here. The server runs UTC and
                // several code paths still derive dates from server-local time
                // (e.g. the Friday-only withdrawal check in payoutService). The IST
                // day boundary used by the pair cap is now TZ-independent via
                // matchingMath.istDayBounds(); pinning TZ is a Phase 1 change that
                // must be made together with an audit of those other call sites.
            }
        }
    ]
};

// Log rotation is a pm2-logrotate module setting, not an ecosystem key. Run once:
//   pm2 install pm2-logrotate
//   pm2 set pm2-logrotate:max_size 50M
//   pm2 set pm2-logrotate:retain 7
//   pm2 set pm2-logrotate:compress true
