const publicHandlers = require('./public');
const productsHandler = require('./products');
const { supabase } = require('../lib/supabaseClient');
const { generatePresignedUploadUrl } = require('../lib/s3');
const { processProductImages, addDiscountToProduct } = require('../lib/product-utils');
const { getCorsHeaders } = require('../../shared/cors');

function pathStartsWith(path, prefix) {
    return String(path || '').startsWith(prefix);
}

function isAdminUser(user) {
    return user && user.groups && user.groups.includes('admin');
}

function extractUserFromClaims(claims) {
    if (!claims) return null;
    return {
        sub: claims.sub,
        email: claims.email,
        groups: claims['cognito:groups'] || [],
    };
}

async function route(normalizedRequest, deps = {}) {
    const { method, path, claims, body: rawBody } = normalizedRequest;
    const user = extractUserFromClaims(claims);
    const logger = deps.logger || console;

    try {
        // ===== PUBLIC ROUTES (no auth required) =====
        
        // Public site content
        if (method === 'GET' && (pathStartsWith(path, '/public/site-content') || path === '/public/site-content')) {
            return await publicHandlers.getSiteContent(normalizedRequest);
        }

        // Public products
        if (method === 'GET' && (pathStartsWith(path, '/public/products') || path === '/public/products')) {
            if (/^\/public\/products\/[^/]+$/.test(path)) {
                return await publicHandlers.getProductById(normalizedRequest);
            }
            return await publicHandlers.getProducts(normalizedRequest);
        }

        // ===== PROTECTED ROUTES (auth required) =====

        // Parse body once for protected routes
        const body = rawBody ? (typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody) : {};
        const pathParameters = normalizedRequest.pathParameters || {};

        // /products - Admin product operations
        if (pathStartsWith(path, '/products')) {
            // Upload URL endpoint
            if ((method === 'POST' || method === 'PUT') && pathStartsWith(path, '/products/upload-url')) {
                return await publicHandlers.productsUploadUrl(normalizedRequest);
            }

            // Delegate to products handler
            return await productsHandler({
                method,
                pathParameters,
                body,
                user,
                supabase,
                processProductImages,
                addDiscountToProduct,
                isAdminUser,
                generatePresignedUploadUrl,
                logger,
            });
        }

        // Default 404
        return { 
            statusCode: 404, 
            body: JSON.stringify({ error: 'Not found', path, method }), 
            headers: getCorsHeaders(normalizedRequest.rawEvent?.headers?.origin || normalizedRequest.rawEvent?.headers?.Origin)
        };
    } catch (err) {
        logger.error('Router error', err);
        return { 
            statusCode: 500, 
            body: JSON.stringify({ error: err.message || 'Internal server error' }), 
            headers: getCorsHeaders(normalizedRequest.rawEvent?.headers?.origin || normalizedRequest.rawEvent?.headers?.Origin)
        };
    }
}

module.exports = { route };
