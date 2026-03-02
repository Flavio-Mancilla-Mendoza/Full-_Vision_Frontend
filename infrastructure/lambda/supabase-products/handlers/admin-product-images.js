// Handler for admin product image record management
const { getCorsHeaders } = require('../shared/cors');

module.exports = async function handleAdminProductImages({ method, pathParameters, body, user, supabase, isAdminUser, logger, normalizedRequest }) {
    const origin = normalizedRequest?.rawEvent?.headers?.origin || normalizedRequest?.rawEvent?.headers?.Origin;
    const headers = getCorsHeaders(origin);

    if (!user) {
        return { statusCode: 401, body: JSON.stringify({ error: 'Authentication required' }), headers };
    }
    if (!isAdminUser(user)) {
        return { statusCode: 403, body: JSON.stringify({ error: 'Admin access required' }), headers };
    }

    const imageId = pathParameters?.imageId;

    switch (method) {
        case 'GET': {
            // GET /admin/product-images?product_id=xxx
            const productId = normalizedRequest?.rawEvent?.queryStringParameters?.product_id
                || normalizedRequest?.rawEvent?.queryStringParameters?.productId;
            if (!productId) {
                return { statusCode: 400, body: JSON.stringify({ error: 'product_id query parameter is required' }), headers };
            }
            const { data, error } = await supabase
                .from('product_images')
                .select('*')
                .eq('product_id', productId)
                .order('sort_order', { ascending: true });
            if (error) throw error;
            return { statusCode: 200, body: JSON.stringify(data || []), headers };
        }
        case 'POST': {
            // POST /admin/product-images - create image record
            if (!body?.product_id) {
                return { statusCode: 400, body: JSON.stringify({ error: 'product_id is required in body' }), headers };
            }
            const IMAGE_INSERT_FIELDS = ['product_id', 'url', 's3_key', 'alt_text', 'sort_order', 'is_primary'];
            const insertData = {};
            for (const key of IMAGE_INSERT_FIELDS) {
                if (body[key] !== undefined) insertData[key] = body[key];
            }
            const { data, error } = await supabase
                .from('product_images')
                .insert([insertData])
                .select()
                .single();
            if (error) throw error;
            return { statusCode: 201, body: JSON.stringify(data), headers };
        }
        case 'PUT': {
            // PUT /admin/product-images/primary - set primary image
            if (imageId === 'primary') {
                const { product_id, image_id } = body || {};
                if (!product_id || !image_id) {
                    return { statusCode: 400, body: JSON.stringify({ error: 'product_id and image_id are required' }), headers };
                }
                // Reset all images for product
                await supabase
                    .from('product_images')
                    .update({ is_primary: false })
                    .eq('product_id', product_id);
                // Set the selected one as primary
                const { error } = await supabase
                    .from('product_images')
                    .update({ is_primary: true })
                    .eq('id', image_id);
                if (error) throw error;
                return { statusCode: 200, body: JSON.stringify({ success: true }), headers };
            }

            // PUT /admin/product-images/{imageId} - update image record
            if (!imageId) {
                return { statusCode: 400, body: JSON.stringify({ error: 'Image ID is required' }), headers };
            }
            const IMAGE_UPDATE_FIELDS = ['url', 's3_key', 'alt_text', 'sort_order', 'is_primary'];
            const updateData = {};
            for (const key of IMAGE_UPDATE_FIELDS) {
                if (body[key] !== undefined) updateData[key] = body[key];
            }
            const { data, error } = await supabase
                .from('product_images')
                .update(updateData)
                .eq('id', imageId)
                .select()
                .single();
            if (error) throw error;
            return { statusCode: 200, body: JSON.stringify(data), headers };
        }
        case 'DELETE': {
            // DELETE /admin/product-images/{imageId} - delete image record
            if (!imageId) {
                return { statusCode: 400, body: JSON.stringify({ error: 'Image ID is required' }), headers };
            }
            const { error } = await supabase
                .from('product_images')
                .delete()
                .eq('id', imageId);
            if (error) throw error;
            return { statusCode: 200, body: JSON.stringify({ deleted: true }), headers };
        }
        default:
            return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }), headers };
    }
};
