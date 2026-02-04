// Handler modularizado para productos
// Extrae las dependencias necesarias del contexto global

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
    logger
}) {
    switch (method) {
        case 'GET': {
            if (pathParameters?.id) {
                const { data, error } = await supabase
                    .from('products')
                    .select(`
						*,
						category:product_categories(name),
						brand:brands(name),
						product_images(id, url, alt_text, is_primary, s3_key, sort_order)
					`)
                    .eq('id', pathParameters.id)
                    .eq('is_active', true)
                    .single();
                if (error) throw error;
                const productWithImages = await processProductImages(data);
                const productWithDiscount = addDiscountToProduct(productWithImages);
                return { statusCode: 200, body: JSON.stringify(productWithDiscount) };
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
                return { statusCode: 200, body: JSON.stringify(productsWithImages) };
            }
        }
        case 'POST': {
            if (!user) {
                return { statusCode: 401, body: JSON.stringify({ error: 'Authentication required' }) };
            }
            if (pathParameters?.id === 'check-sku' || (body && body.action === 'check-sku')) {
                try {
                    const { sku, excludeProductId } = body || {};
                    if (!sku) return { statusCode: 400, body: JSON.stringify({ error: 'sku is required' }) };
                    const { data, error } = await supabase.from('products').select('id').eq('sku', sku);
                    if (error) throw error;
                    const exists = data && data.length > 0 && (!excludeProductId || data.some(d => d.id !== excludeProductId));
                    return { statusCode: 200, body: JSON.stringify({ exists }) };
                } catch (err) {
                    logger && logger.error && logger.error('Error checking SKU existence', err);
                    return { statusCode: 200, body: JSON.stringify({ exists: false }) };
                }
            }

            if (pathParameters?.id === 'check-slug' || (body && body.action === 'check-slug')) {
                try {
                    const { slug, excludeProductId } = body || {};
                    if (!slug) return { statusCode: 400, body: JSON.stringify({ error: 'slug is required' }) };
                    const { data, error } = await supabase.from('products').select('id').eq('slug', slug);
                    if (error) throw error;
                    const exists = data && data.length > 0 && (!excludeProductId || data.some(d => d.id !== excludeProductId));
                    return { statusCode: 200, body: JSON.stringify({ exists }) };
                } catch (err) {
                    logger && logger.error && logger.error('Error checking slug existence', err);
                    return { statusCode: 200, body: JSON.stringify({ exists: false }) };
                }
            }

            if (pathParameters?.id === 'generate-sku' || (body && body.action === 'generate-sku')) {
                try {
                    if (!isAdminUser(user)) return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden: Admin access required' }) };
                    const { name, frame_style, frame_size, excludeProductId } = body || {};
                    if (!name) return { statusCode: 400, body: JSON.stringify({ error: 'name is required' }) };
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
                    return { statusCode: 200, body: JSON.stringify({ sku }) };
                } catch (err) {
                    logger && logger.error && logger.error('Error generating SKU', err);
                    return { statusCode: 500, body: JSON.stringify({ error: 'Error generating SKU' }) };
                }
            }

            if (pathParameters?.id === 'upload-url') {
                logger && logger.info && logger.info('=== UPLOAD-URL REQUEST ===', { pathParameters, userGroups: user.groups });
                if (!isAdminUser(user)) return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden: Admin access required', groups: user.groups }) };
                const { fileName, contentType } = body || {};
                if (!fileName || !contentType) return { statusCode: 400, body: JSON.stringify({ error: 'fileName and contentType are required' }) };
                const result = await generatePresignedUploadUrl(fileName, contentType);
                return { statusCode: 200, body: JSON.stringify(result) };
            }
            if (!isAdminUser(user)) return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden: Admin access required' }) };
            const { data, error } = await supabase.from('products').insert(body).select().single();
            if (error) throw error;
            return { statusCode: 201, body: JSON.stringify(data) };
        }
        case 'PUT': {
            if (!user) return { statusCode: 401, body: JSON.stringify({ error: 'Authentication required' }) };
            if (!isAdminUser(user)) return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden: Admin access required' }) };
            const { data, error } = await supabase.from('products').update(body).eq('id', pathParameters.id).select().single();
            if (error) throw error;
            return { statusCode: 200, body: JSON.stringify(data) };
        }
        case 'DELETE': {
            if (!user) return { statusCode: 401, body: JSON.stringify({ error: 'Authentication required' }) };
            if (!isAdminUser(user)) return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden: Admin access required' }) };
            const { error } = await supabase.from('products').delete().eq('id', pathParameters.id);
            if (error) throw error;
            return { statusCode: 204, body: '' };
        }
        default:
            return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }
};

