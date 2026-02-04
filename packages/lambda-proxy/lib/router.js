// Router centralizado: exporta `routeRequest(normalizedRequest, user, deps)`
import handleProducts from '../handlers/products.js';
import handleAppointments from '../handlers/appointments.js';
import handleOrders from '../handlers/orders.js';
import handleBrands from '../handlers/brands.js';
import handleSiteContent from '../handlers/siteContent.js';

export async function routeRequest(normalizedRequest, user, deps) {
    const { method, path = '/', pathParameters = {}, body: rawBody = null } = normalizedRequest || {};
    const {
        supabase,
        processProductImages,
        addDiscountToProduct,
        validateAndCalculateOrderItems,
        generatePresignedUploadUrl,
        logger = console,
        isAdminUser,
    } = deps || {};

    logger?.debug?.('Routing:', { method, path, user: user?.email || 'public' });

    let body = null;
    if (rawBody) {
        try {
            body = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
        } catch (err) {
            logger?.error?.('Invalid JSON body', err);
            return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
        }
    }

    // Rutas públicas (sin autenticación)
    if (path.startsWith('/public/products') || path.startsWith('/dev/public/products')) {
        return await handleProducts({ method, pathParameters, body, user: null, supabase, processProductImages, addDiscountToProduct, isAdminUser, generatePresignedUploadUrl, logger });
    }

    // Rutas protegidas - requieren autenticación
    if (!user) {
        return { statusCode: 401, body: JSON.stringify({ error: 'Authentication required' }) };
    }

    // Productos - upload-url (caso especial)
    if (path === '/products/upload-url' || path === '/dev/products/upload-url') {
        return await handleProducts({ method, pathParameters: { id: 'upload-url' }, body, user, supabase, processProductImages, addDiscountToProduct, isAdminUser, generatePresignedUploadUrl, logger });
    }

    // Productos (protegido)
    if (path.startsWith('/products') || path.startsWith('/dev/products')) {
        return await handleProducts({ method, pathParameters, body, user, supabase, processProductImages, addDiscountToProduct, isAdminUser, generatePresignedUploadUrl, logger });
    }

    // Órdenes
    if (path.startsWith('/orders') || path.startsWith('/dev/orders')) {
        return await handleOrders({ method, pathParameters, body, user, supabase, processProductImages, addDiscountToProduct, logger });
    }

    // Appointments
    if (path.startsWith('/appointments') || path.startsWith('/dev/appointments')) {
        return await handleAppointments({ method, pathParameters, body, user, supabase, logger, isAdminUser });
    }

    // Brands
    if (path.startsWith('/brands') || path.startsWith('/dev/brands') || path.startsWith('/public/brands')) {
        return await handleBrands({ method, pathParameters, body, user, supabase, logger });
    }

    // Site content
    if (path.startsWith('/site-content') || path.startsWith('/dev/site-content') || path.startsWith('/public/site-content')) {
        return await handleSiteContent({ method, pathParameters, body, user, supabase, logger });
    }

    return { statusCode: 404, body: JSON.stringify({ error: 'Route not found' }) };
}
