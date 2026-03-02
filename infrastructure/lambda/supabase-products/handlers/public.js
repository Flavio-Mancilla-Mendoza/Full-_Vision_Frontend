const { supabase } = require('../lib/supabaseClient');
const { generatePresignedUploadUrl } = require('../lib/s3');
const { getCorsHeaders } = require('../shared/cors');

function getOrigin(normalizedRequest) {
    return normalizedRequest.rawEvent?.headers?.origin || normalizedRequest.rawEvent?.headers?.Origin;
}

async function getSiteContent(normalizedRequest) {
    const origin = getOrigin(normalizedRequest);
    // Extract section from pathParameters or from the URL path
    // Path is /public/site-content or /public/site-content/{section}
    let section = (normalizedRequest.pathParameters && normalizedRequest.pathParameters.section) || null;
    if (!section) {
        const pathParts = (normalizedRequest.path || '').split('/').filter(Boolean);
        // ['public', 'site-content'] or ['public', 'site-content', 'hero']
        if (pathParts.length > 2 && pathParts[0] === 'public' && pathParts[1] === 'site-content') {
            section = pathParts[2];
        }
    }
    try {
        if (section) {
            const { data, error } = await supabase.from('site_content').select('*').eq('section', section).order('sort_order', { ascending: true });
            if (error) throw error;
            return {
                statusCode: 200,
                body: JSON.stringify(data),
                headers: getCorsHeaders(origin),
            };
        }
        let query = supabase.from('site_content').select('*').order('section', { ascending: true });
        query = query.order('sort_order', { ascending: true });
        const { data, error } = await query;
        if (error) throw error;
        return { statusCode: 200, body: JSON.stringify(data), headers: getCorsHeaders(origin) };
    } catch (err) {
        return errorResponse(err, origin);
    }
}

async function getProducts(normalizedRequest) {
    const origin = getOrigin(normalizedRequest);
    try {
        const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false }).limit(100);
        if (error) throw error;
        return { statusCode: 200, body: JSON.stringify(data), headers: getCorsHeaders(origin) };
    } catch (err) {
        return errorResponse(err, origin);
    }
}

async function getProductById(normalizedRequest) {
    const origin = getOrigin(normalizedRequest);
    const id = (normalizedRequest.pathParameters && normalizedRequest.pathParameters.id) || null;
    if (!id) return { statusCode: 400, body: JSON.stringify({ error: 'Missing id' }), headers: getCorsHeaders(origin) };
    try {
        const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
        if (error) throw error;
        return { statusCode: 200, body: JSON.stringify(data), headers: getCorsHeaders(origin) };
    } catch (err) {
        return errorResponse(err, origin);
    }
}

async function productsUploadUrl(normalizedRequest) {
    const origin = getOrigin(normalizedRequest);
    try {
        const body = normalizedRequest.body ? JSON.parse(normalizedRequest.body) : {};
        const { fileName, contentType } = body;
        if (!fileName || !contentType) return { statusCode: 400, body: JSON.stringify({ error: 'fileName and contentType required' }), headers: getCorsHeaders(origin) };
        const { uploadUrl, s3Key } = await generatePresignedUploadUrl(fileName, contentType);
        return { statusCode: 200, body: JSON.stringify({ uploadUrl, s3Key }), headers: getCorsHeaders(origin) };
    } catch (err) {
        return errorResponse(err, origin);
    }
}

function errorResponse(err, origin) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message || 'Internal error' }), headers: getCorsHeaders(origin) };
}

module.exports = {
    getSiteContent,
    getProducts,
    getProductById,
    productsUploadUrl,
};
