/**
 * Lambda Proxy para Supabase
 * Convierte JWT de Cognito en llamadas a Supabase con SERVICE_ROLE
 * 
 * Runtime: Node.js 20.x
 * Timeout: 30 segundos
 * Memory: 512 MB
 * Restored from CDK asset
 * Updated: 2026-02-05 - Added cart routes and CORS fix for localhost:8081
 */

const router = require('./handlers/router');
const { getCorsHeaders, handleCorsPreFlight } = require('./shared/cors');
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

const logger = {
    debug: (...args) => LOG_LEVEL === 'debug' && console.log('[DEBUG]', ...args),
    info: (...args) => console.log('[INFO]', ...args),
    warn: (...args) => console.warn('[WARN]', ...args),
    error: (...args) => console.error('[ERROR]', ...args),
};

function normalizeRequest(event) {
    const isHttpApi = event.version === '2.0' || Boolean(event.requestContext?.http?.method);
    if (isHttpApi) {
        // Strip stage prefix from rawPath (e.g., "/dev/cart" -> "/cart")
        let rawPath = event.rawPath || '/';
        const stage = event.requestContext?.stage;
        if (stage && stage !== '$default' && rawPath.startsWith(`/${stage}`)) {
            rawPath = rawPath.substring(`/${stage}`.length) || '/';
        }
        return {
            method: event.requestContext?.http?.method,
            path: rawPath,
            pathParameters: event.pathParameters || {},
            body: event.body,
            claims: event.requestContext?.authorizer?.jwt?.claims,
            rawEvent: event,
        };
    } else {
        return {
            method: event.httpMethod,
            path: event.path || event.resource,
            pathParameters: event.pathParameters || {},
            body: event.body,
            claims: event.requestContext?.authorizer?.claims,
            rawEvent: event,
        };
    }
}

exports.handler = async function (event) {
    const origin = event.headers?.origin || event.headers?.Origin;
    logger.info('Supabase Proxy invoked');
    logger.debug('Event:', JSON.stringify(event, null, 2));
    try {
        const normalizedRequest = normalizeRequest(event);
        // Handle preflight
        if (normalizedRequest.method === 'OPTIONS') {
            return handleCorsPreFlight(origin);
        }

        const response = await router.route(normalizedRequest, { logger });
        return response;
    } catch (err) {
        logger.error('Error in Lambda handler:', err);
        return { statusCode: 500, body: JSON.stringify({ error: err.message || 'Internal server error' }), headers: getCorsHeaders(origin) };
    }
};
