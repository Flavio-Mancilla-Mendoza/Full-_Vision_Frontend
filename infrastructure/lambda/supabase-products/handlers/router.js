const publicHandlers = require('./public');
const productsHandler = require('./products');
const cartHandler = require('./cart');
const ordersHandler = require('./orders');
const profileHandler = require('./profile');
const brandsHandler = require('./brands');
const dashboardHandler = require('./dashboard');
const siteContentHandler = require('./site-content');
const adminProfilesHandler = require('./admin-profiles');
const categoriesHandler = require('./categories');
const adminProductImagesHandler = require('./admin-product-images');
const { supabase } = require('../lib/supabaseClient');
const { generatePresignedUrl, generatePresignedUploadUrl, deleteObject } = require('../lib/s3');
const { processProductImages: _processProductImages, addDiscountToProduct } = require('../lib/product-utils');
const { getUserFromCognito, isAdminUser } = require('../lib/auth');
const { getCorsHeaders } = require('../shared/cors');

function pathStartsWith(path, prefix) {
    return String(path || '').startsWith(prefix);
}

function extractUserFromClaims(claims) {
    // Delegate to auth.js for robust group handling (string vs array)
    return getUserFromCognito({ claims });
}

// Bind generatePresignedUrl into processProductImages so handlers don't need to pass it
async function processProductImages(product) {
    return _processProductImages(product, { generatePresignedUrl, logger: console });
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

        // /admin/dashboard - Admin dashboard stats
        if (pathStartsWith(path, '/admin/dashboard')) {
            return await dashboardHandler({
                method,
                user,
                supabase,
                logger,
                normalizedRequest,
            });
        }

        // /admin/site-content - Admin site content management
        if (pathStartsWith(path, '/admin/site-content')) {
            return await siteContentHandler({
                method,
                path,
                user,
                supabase,
                body,
                logger,
                normalizedRequest,
            });
        }

        // /admin/profiles - Admin profile management (list, create, update)
        if (pathStartsWith(path, '/admin/profiles')) {
            const profileIdMatch = path.match(/\/admin\/profiles\/([^/]+)$/);
            if (profileIdMatch) {
                pathParameters.profileId = pathParameters.profileId || profileIdMatch[1];
            }
            return await adminProfilesHandler({
                method,
                pathParameters,
                body,
                user,
                supabase,
                isAdminUser,
                logger,
                normalizedRequest,
            });
        }

        // /admin/product-images - Admin product image record management
        if (pathStartsWith(path, '/admin/product-images')) {
            const imageIdMatch = path.match(/\/admin\/product-images\/([^/]+)$/);
            if (imageIdMatch) {
                pathParameters.imageId = pathParameters.imageId || imageIdMatch[1];
            }
            return await adminProductImagesHandler({
                method,
                pathParameters,
                body,
                user,
                supabase,
                isAdminUser,
                logger,
                normalizedRequest,
            });
        }

        // /categories - Product categories listing
        if (pathStartsWith(path, '/categories')) {
            return await categoriesHandler({
                method,
                user,
                supabase,
                normalizedRequest,
            });
        }

        // /products - Admin product operations
        if (pathStartsWith(path, '/products')) {
            // Upload URL endpoint - requires admin auth
            if ((method === 'POST' || method === 'PUT') && pathStartsWith(path, '/products/upload-url')) {
                if (!user) {
                    return { statusCode: 401, body: JSON.stringify({ error: 'Authentication required' }), headers: getCorsHeaders(normalizedRequest.rawEvent?.headers?.origin) };
                }
                if (!isAdminUser(user)) {
                    return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden: Admin access required' }), headers: getCorsHeaders(normalizedRequest.rawEvent?.headers?.origin) };
                }
                return await publicHandlers.productsUploadUrl(normalizedRequest);
            }

            // DELETE /products/images - Delete image from S3 and DB
            if (method === 'DELETE' && pathStartsWith(path, '/products/images')) {
                if (!user) {
                    return { statusCode: 401, body: JSON.stringify({ error: 'Authentication required' }), headers: getCorsHeaders(normalizedRequest.rawEvent?.headers?.origin) };
                }
                if (!isAdminUser(user)) {
                    return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden: Admin access required' }), headers: getCorsHeaders(normalizedRequest.rawEvent?.headers?.origin) };
                }

                const origin = normalizedRequest.rawEvent?.headers?.origin || normalizedRequest.rawEvent?.headers?.Origin;

                try {
                    // Extract s3Key from path: /products/images/{encodedS3Key}
                    const s3KeyEncoded = path.replace('/products/images/', '');
                    const s3Key = decodeURIComponent(s3KeyEncoded);

                    if (!s3Key || s3Key === '/products/images') {
                        return { statusCode: 400, body: JSON.stringify({ error: 's3Key is required' }), headers: getCorsHeaders(origin) };
                    }

                    // 1. Delete from S3
                    await deleteObject(s3Key);
                    logger.info('Deleted from S3:', s3Key);

                    // 2. Delete from database (product_images table) - use parameterized query
                    const { error: dbError } = await supabase
                        .from('product_images')
                        .delete()
                        .eq('s3_key', s3Key);

                    if (dbError) {
                        logger.warn('Image deleted from S3 but DB cleanup failed:', dbError.message);
                    }

                    return {
                        statusCode: 200,
                        body: JSON.stringify({ deleted: true, s3Key }),
                        headers: getCorsHeaders(origin),
                    };
                } catch (err) {
                    logger.error('Error deleting image:', err);
                    return {
                        statusCode: 500,
                        body: JSON.stringify({ error: err.message || 'Error deleting image' }),
                        headers: getCorsHeaders(origin),
                    };
                }
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
                normalizedRequest,
            });
        }

        // /cart - Cart operations
        if (pathStartsWith(path, '/cart')) {
            return await cartHandler({
                method,
                pathParameters,
                body,
                user,
                supabase,
                logger,
                normalizedRequest,
            });
        }

        // /orders - Orders operations
        if (pathStartsWith(path, '/orders')) {
            if (!user) {
                return { statusCode: 401, body: JSON.stringify({ error: 'Authentication required' }), headers: getCorsHeaders(normalizedRequest.rawEvent?.headers?.origin) };
            }
            // Extract order ID from path: /orders/{id} (but not /orders/checkout or /orders/counts)
            const orderIdMatch = path.match(/^\/orders\/([^/]+)$/);
            if (orderIdMatch && orderIdMatch[1] !== 'checkout' && orderIdMatch[1] !== 'counts') {
                pathParameters.id = orderIdMatch[1];
            }
            return await ordersHandler({
                method,
                pathParameters,
                body,
                user,
                supabase,
                processProductImages,
                addDiscountToProduct,
                logger,
                normalizedRequest,
            });
        }

        // /profile - User profile operations
        if (pathStartsWith(path, '/profile')) {
            if (!user) {
                return { statusCode: 401, body: JSON.stringify({ error: 'Authentication required' }), headers: getCorsHeaders(normalizedRequest.rawEvent?.headers?.origin) };
            }
            return await profileHandler({
                method,
                body,
                user,
                supabase,
                logger,
                normalizedRequest,
            });
        }

        // /brands - Brands operations
        if (pathStartsWith(path, '/brands')) {
            if (!user) {
                return { statusCode: 401, body: JSON.stringify({ error: 'Authentication required' }), headers: getCorsHeaders(normalizedRequest.rawEvent?.headers?.origin) };
            }
            return await brandsHandler({
                method,
                pathParameters,
                body,
                user,
                supabase,
                logger,
                normalizedRequest,
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
