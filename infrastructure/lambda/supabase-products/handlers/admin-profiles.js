// Handler for admin profile management (list, create, update profiles)
const { getCorsHeaders } = require('../shared/cors');

module.exports = async function handleAdminProfiles({ method, pathParameters, body, user, supabase, isAdminUser, logger, normalizedRequest }) {
    const origin = normalizedRequest?.rawEvent?.headers?.origin || normalizedRequest?.rawEvent?.headers?.Origin;
    const headers = getCorsHeaders(origin);

    if (!user) {
        return { statusCode: 401, body: JSON.stringify({ error: 'Authentication required' }), headers };
    }
    if (!isAdminUser(user)) {
        return { statusCode: 403, body: JSON.stringify({ error: 'Admin access required' }), headers };
    }

    const profileId = pathParameters?.profileId;

    switch (method) {
        case 'GET': {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, email, full_name, role, phone, is_active, created_at, updated_at')
                .order('created_at', { ascending: false });
            if (error) throw error;
            return { statusCode: 200, body: JSON.stringify(data || []), headers };
        }
        case 'POST': {
            if (!body || !body.email) {
                return { statusCode: 400, body: JSON.stringify({ error: 'Email is required' }), headers };
            }
            const PROFILE_INSERT_FIELDS = ['id', 'email', 'full_name', 'role', 'phone', 'is_active'];
            const insertData = {};
            for (const key of PROFILE_INSERT_FIELDS) {
                if (body[key] !== undefined) insertData[key] = body[key];
            }
            const { data, error } = await supabase
                .from('profiles')
                .insert([insertData])
                .select()
                .single();
            if (error) throw error;
            return { statusCode: 201, body: JSON.stringify(data), headers };
        }
        case 'PUT': {
            if (!profileId) {
                return { statusCode: 400, body: JSON.stringify({ error: 'Profile ID is required' }), headers };
            }
            const PROFILE_UPDATE_FIELDS = ['email', 'full_name', 'role', 'phone', 'is_active'];
            const updates = {};
            for (const key of PROFILE_UPDATE_FIELDS) {
                if (body[key] !== undefined) updates[key] = body[key];
            }
            updates.updated_at = new Date().toISOString();
            const { data, error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', profileId)
                .select()
                .single();
            if (error) throw error;
            return { statusCode: 200, body: JSON.stringify(data), headers };
        }
        default:
            return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }), headers };
    }
};
