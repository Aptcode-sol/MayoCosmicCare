const fs = require('fs');
const path = require('path');
let winston;
try { winston = require('winston'); } catch (e) { winston = null; }

const logDir = path.join(__dirname, '..');
const workerLogPath = path.join(logDir, 'worker.log');

function info(msg, meta) {
    const line = JSON.stringify({ level: 'info', message: msg, meta, ts: new Date().toISOString() });
    if (winston) {
        const logger = winston.createLogger({ transports: [new winston.transports.File({ filename: workerLogPath })] });
        logger.info(msg, meta);
    } else {
        fs.appendFileSync(workerLogPath, line + '\n');
    }
}

function error(msg, meta) {
    const line = JSON.stringify({ level: 'error', message: msg, meta, ts: new Date().toISOString() });
    if (winston) {
        const logger = winston.createLogger({ transports: [new winston.transports.File({ filename: workerLogPath })] });
        logger.error(msg, meta);
    } else {
        fs.appendFileSync(workerLogPath, line + '\n');
    }
}

function tailWorkerLogs(res) {
    // Stream last 500 lines (simple implementation)
    if (!fs.existsSync(workerLogPath)) {
        res.status(404).json({ ok: false, error: 'No worker logs' });
        return;
    }
    const data = fs.readFileSync(workerLogPath, 'utf8');
    const lines = data.trim().split(/\r?\n/).slice(-500);
    res.json({ ok: true, lines });
}

module.exports = { info, error, tailWorkerLogs };
