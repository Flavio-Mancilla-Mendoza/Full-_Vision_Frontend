// Normalización de request entre REST API (v1) y HTTP API (v2)
function normalizeRequest(event) {
    const isHttpApi = event.version === '2.0' || event.requestContext?.http?.method;

    if (isHttpApi) {
        return {
            method: event.requestContext?.http?.method,
            path: event.rawPath,
            pathParameters: event.pathParameters || {},
            body: event.body,
            claims: event.requestContext?.authorizer?.jwt?.claims,
        };
    } else {
        return {
            method: event.httpMethod,
            path: event.resource,
            pathParameters: event.pathParameters || {},
            body: event.body,
            claims: event.requestContext?.authorizer?.claims,
        };
    }
}

module.exports = { normalizeRequest };
