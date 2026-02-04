// Handler modularizado para site content
export default async function handleSiteContent({ method, pathParameters, body, user, supabase, logger }) {
    if (method === 'GET') {
        try {
            let query = supabase.from('site_content').select('*').eq('is_active', true);
            if (pathParameters?.section) query = query.eq('section', pathParameters.section);
            const { data, error } = await query.order('sort_order');
            if (error) throw error;
            return { statusCode: 200, body: JSON.stringify(data || []) };
        } catch (error) {
            logger.error('Error fetching site content:', error);
            throw error;
        }
    }
    if (!user) {
        return { statusCode: 401, body: JSON.stringify({ error: 'Authentication required' }) };
    }
    if (!(user.groups && user.groups.includes('admins'))) {
        return { statusCode: 403, body: JSON.stringify({ error: 'Admin access required' }) };
    }
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
};
