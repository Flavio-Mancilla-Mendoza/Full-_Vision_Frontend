/**
 * Shared CORS configuration for all lambdas
 */

const ALLOWED_ORIGINS = [
    'http://localhost:8080',
    'http://localhost:8081',
    'http://localhost:5173',
    'https://full-vision.vercel.app'
];

function getCorsHeaders(origin) {
    // Si el origin está en la lista permitida, usarlo; si no, usar el primero de la lista.
    // NUNCA usar '*' con Access-Control-Allow-Credentials: true (los navegadores lo rechazan).
    const allowOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
    
    return { 
        'Content-Type': 'application/json', 
        'Access-Control-Allow-Origin': allowOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400'
    };
}

function handleCorsPreFlight(origin) {
    return {
        statusCode: 200,
        headers: getCorsHeaders(origin),
        body: ''
    };
}

module.exports = {
    getCorsHeaders,
    handleCorsPreFlight,
    ALLOWED_ORIGINS
};
