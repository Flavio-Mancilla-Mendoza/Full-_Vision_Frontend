const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

const logger = {
    debug: (...args) => LOG_LEVEL === 'debug' && console.log('[DEBUG]', ...args),
    info: (...args) => console.log('[INFO]', ...args),
    warn: (...args) => console.warn('[WARN]', ...args),
    error: (...args) => console.error('[ERROR]', ...args),
};

module.exports = { LOG_LEVEL, logger };
