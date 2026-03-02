// Handler modularizado para productos
// Extrae las dependencias necesarias del contexto global
const { getCorsHeaders } = require('../shared/cors');

/**
 * Extract the sub-path segment after /products/
 * e.g. /products/check-sku -> 'check-sku'
 *      /products/abc-123   -> 'abc-123'
 *      /products            -> null
 */
function extractProductSubpath(path) {
    const match = (path || '').match(/^\/products\/([^/]+)$/);
    return match ? match[1] : null;
}

module.exports = async function handleProducts({
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
    normalizedRequest
}) {
    const origin = normalizedRequest?.rawEvent?.headers?.origin || normalizedRequest?.rawEvent?.headers?.Origin;
    const headers = getCorsHeaders(origin);

    // Resolve product ID / action from pathParameters OR from the URL path
    const subpath = extractProductSubpath(normalizedRequest?.path);
    const productIdOrAction = pathParameters?.id || subpath;

    switch (method) {
        case 'GET': {
            if (productIdOrAction) {
                const { data, error } = await supabase
                    .from('products')
                    .select(`
						*,
						category:product_categories(name),
						brand:brands(name),
						product_images(id, url, alt_text, is_primary, s3_key, sort_order)
					`)
                    .eq('id', productIdOrAction)
                    .eq('is_active', true)
                    .single();
                if (error) throw error;
                const productWithImages = await processProductImages(data);
                const productWithDiscount = addDiscountToProduct(productWithImages);
                return { statusCode: 200, body: JSON.stringify(productWithDiscount), headers };
            } else {
                let query = supabase
                    .from('products')
                    .select(`
						*,
						category:product_categories(name),
						brand:brands(name),
						product_images(id, url, alt_text, is_primary, s3_key, sort_order)
					`)
                    .order('created_at', { ascending: false });
                if (!user) {
                    query = query.eq('is_active', true);
                }
                const { data, error } = await query;
                if (error) throw error;
                const productsWithImages = await Promise.all(
                    (data || []).map(async (product) => {
                        const withImages = await processProductImages(product);
                        return addDiscountToProduct(withImages);
                    })
                );
                return { statusCode: 200, body: JSON.stringify(productsWithImages), headers };
            }
        }
        case 'POST': {
            if (!user) {
                return { statusCode: 401, body: JSON.stringify({ error: 'Authentication required' }), headers };
            }
            if (productIdOrAction === 'check-sku' || (body && body.action === 'check-sku')) {
                try {
                    const { sku, excludeProductId } = body || {};
                    if (!sku) return { statusCode: 400, body: JSON.stringify({ error: 'sku is required' }), headers };
                    const { data, error } = await supabase.from('products').select('id').eq('sku', sku);
                    if (error) throw error;
                    const exists = data && data.length > 0 && (!excludeProductId || data.some(d => d.id !== excludeProductId));
                    return { statusCode: 200, body: JSON.stringify({ exists }), headers };
                } catch (err) {
                    logger && logger.error && logger.error('Error checking SKU existence', err);
                    return { statusCode: 200, body: JSON.stringify({ exists: false }), headers };
                }
            }

            if (productIdOrAction === 'check-slug' || (body && body.action === 'check-slug')) {
                try {
                    const { slug, excludeProductId } = body || {};
                    if (!slug) return { statusCode: 400, body: JSON.stringify({ error: 'slug is required' }), headers };
                    const { data, error } = await supabase.from('products').select('id').eq('slug', slug);
                    if (error) throw error;
                    const exists = data && data.length > 0 && (!excludeProductId || data.some(d => d.id !== excludeProductId));
                    return { statusCode: 200, body: JSON.stringify({ exists }), headers };
                } catch (err) {
                    logger && logger.error && logger.error('Error checking slug existence', err);
                    return { statusCode: 200, body: JSON.stringify({ exists: false }), headers };
                }
            }

            if (productIdOrAction === 'generate-sku' || (body && body.action === 'generate-sku')) {
                try {
                    if (!isAdminUser(user)) return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden: Admin access required' }), headers };
                    const { name, frame_style, frame_size, excludeProductId } = body || {};
                    if (!name) return { statusCode: 400, body: JSON.stringify({ error: 'name is required' }), headers };
                    const gen = (n, style, size) => {
                        const prefix = 'FV';
                        const nameCode = (n || '').split(' ').map(w => (w || '').substring(0, 2).toUpperCase()).join('').substring(0, 4);
                        const styleCode = style ? style.substring(0, 3).toUpperCase() : 'GEN';
                        const sizeCode = size ? size.toUpperCase() : 'M';
                        const randomCode = Math.random().toString(36).substring(2, 5).toUpperCase();
                        return `${prefix}-${nameCode}-${styleCode}-${sizeCode}-${randomCode}`;
                    };
                    let sku = gen(name, frame_style, frame_size);
                    let attempts = 0;
                    while (attempts < 5) {
                        const { data, error } = await supabase.from('products').select('id').eq('sku', sku);
                        if (error) throw error;
                        const exists = data && data.length > 0 && (!excludeProductId || data.some(d => d.id !== excludeProductId));
                        if (!exists) break;
                        attempts++;
                        sku = gen(name, frame_style, frame_size);
                    }
                    return { statusCode: 200, body: JSON.stringify({ sku }), headers };
                } catch (err) {
                    logger && logger.error && logger.error('Error generating SKU', err);
                    return { statusCode: 500, body: JSON.stringify({ error: 'Error generating SKU' }), headers };
                }
            }

            if (productIdOrAction === 'upload-url') {
                logger && logger.info && logger.info('=== UPLOAD-URL REQUEST ===', { productIdOrAction, userGroups: user.groups });
                if (!isAdminUser(user)) return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden: Admin access required', groups: user.groups }), headers };
                const { fileName, contentType } = body || {};
                if (!fileName || !contentType) return { statusCode: 400, body: JSON.stringify({ error: 'fileName and contentType are required' }), headers };
                const result = await generatePresignedUploadUrl(fileName, contentType);
                return { statusCode: 200, body: JSON.stringify(result), headers };
            }
            if (!isAdminUser(user)) return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden: Admin access required' }), headers };
            const { data, error } = await supabase.from('products').insert(body).select().single();
            if (error) throw error;
            return { statusCode: 201, body: JSON.stringify(data), headers };
        }
        case 'PUT': {
            if (!user) return { statusCode: 401, body: JSON.stringify({ error: 'Authentication required' }), headers };
            if (!isAdminUser(user)) return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden: Admin access required' }), headers };
            const id = productIdOrAction || pathParameters.id;
            const { data, error } = await supabase.from('products').update(body).eq('id', id).select().single();
            if (error) throw error;
            return { statusCode: 200, body: JSON.stringify(data), headers };
        }
        case 'DELETE': {
            if (!user) return { statusCode: 401, body: JSON.stringify({ error: 'Authentication required' }), headers };
            if (!isAdminUser(user)) return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden: Admin access required' }), headers };
            const delId = productIdOrAction || pathParameters.id;
            const { error } = await supabase.from('products').delete().eq('id', delId);
            if (error) throw error;
            return { statusCode: 204, body: '', headers };
        }
        default:
            return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }), headers };
    }
};

