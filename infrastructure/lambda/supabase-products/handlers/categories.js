// Handler for product categories listing
const { getCorsHeaders } = require('../shared/cors');

module.exports = async function handleCategories({ method, user, supabase, normalizedRequest }) {
    const origin = normalizedRequest?.rawEvent?.headers?.origin || normalizedRequest?.rawEvent?.headers?.Origin;
    const headers = getCorsHeaders(origin);

    if (method === 'GET') {
        const { data, error } = await supabase
            .from('product_categories')
            .select('*')
            .order('name', { ascending: true });
        if (error) throw error;
        return { statusCode: 200, body: JSON.stringify(data || []), headers };
    }

    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }), headers };
};
