const { supabase } = require('./shared/supabaseClient');
const { getCorsHeaders, handleCorsPreFlight } = require('../shared/cors');

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
        const pathParams = event.pathParameters || {};

        // /public/site-content
        if (method === 'GET' && (rawPath === '/public/site-content' || rawPath.startsWith('/public/site-content'))) {
            const section = pathParams.section || (rawPath.split('/').pop() || null);
            if (section) {
                const { data, error } = await supabase.from('site_content').select('*').eq('section', section).order('sort_order', { ascending: true });
                if (error) throw error;
                return { statusCode: 200, body: JSON.stringify(data), headers: getCorsHeaders(origin) };
            }
            const { data, error } = await supabase.from('site_content').select('*').order('section,sort_order', { ascending: true });
            if (error) throw error;
            return { statusCode: 200, body: JSON.stringify(data), headers: getCorsHeaders(origin) };
        }

        // /public/bestsellers
        if (method === 'GET' && (rawPath === '/public/bestsellers' || rawPath.includes('bestsellers'))) {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('is_bestseller', true)
                .eq('is_active', true)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return { statusCode: 200, body: JSON.stringify(data || []), headers: getCorsHeaders(origin) };
        }

        // /public/liquidacion
        if (method === 'GET' && (rawPath === '/public/liquidacion' || rawPath.includes('liquidacion'))) {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('is_liquidacion', true)
                .eq('is_active', true)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return { statusCode: 200, body: JSON.stringify(data || []), headers: getCorsHeaders(origin) };
        }

        // /public/products o /public/products/:id
        if (method === 'GET' && (rawPath === '/public/products' || rawPath.startsWith('/public/products'))) {
            const productId = pathParams.id || null;
            if (productId) {
                const { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .eq('id', productId)
                    .single();
                if (error) throw error;
                return { statusCode: 200, body: JSON.stringify(data), headers: getCorsHeaders(origin) };
            }
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(100);
            if (error) throw error;
            return { statusCode: 200, body: JSON.stringify(data || []), headers: getCorsHeaders(origin) };
        }

        return { statusCode: 404, body: JSON.stringify({ error: 'Not found' }), headers: getCorsHeaders(origin) };
    } catch (err) {
        console.error('public lambda error', err);
        return { statusCode: 500, body: JSON.stringify({ error: err.message || 'Internal error' }), headers: getCorsHeaders(origin) };
    }
};
