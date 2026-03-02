const { generatePresignedUploadUrl } = require('./shared/s3');
const { getCorsHeaders, handleCorsPreFlight } = require('./shared/cors');

exports.handler = async function (event) {
    const origin = event.headers?.origin || event.headers?.Origin;
    
    // Manejar OPTIONS para CORS preflight
    if (event.httpMethod === 'OPTIONS' || event.requestContext?.http?.method === 'OPTIONS') {
        return handleCorsPreFlight(origin);
    }
    
    try {
        const isHttpApi = event.version === '2.0' || Boolean(event.requestContext?.http?.method);
        const method = isHttpApi ? event.requestContext.http.method : event.httpMethod;
        const rawPath = isHttpApi ? event.rawPath : event.resource;

        if ((method === 'POST' || method === 'PUT') && rawPath && rawPath.includes('/upload-url')) {
            const body = event.body ? JSON.parse(event.body) : {};
            const { fileName, contentType } = body;
            if (!fileName || !contentType) return { statusCode: 400, body: JSON.stringify({ error: 'fileName and contentType required' }), headers: getCorsHeaders(origin) };
            const { uploadUrl, s3Key } = await generatePresignedUploadUrl(fileName, contentType);
            return { statusCode: 200, body: JSON.stringify({ uploadUrl, s3Key }), headers: getCorsHeaders(origin) };
        }

        return { statusCode: 404, body: JSON.stringify({ error: 'Not found' }), headers: getCorsHeaders(origin) };
    } catch (err) {
        console.error('uploads lambda error', err);
        return { statusCode: 500, body: JSON.stringify({ error: err.message || 'Internal error' }), headers: getCorsHeaders(origin) };
    }
};
