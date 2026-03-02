// Handler modularizado para perfil de usuario
const { getCorsHeaders } = require('../shared/cors');

// Campos que el usuario puede modificar (whitelist)
const ALLOWED_UPDATE_FIELDS = ['full_name', 'phone', 'address', 'avatar_url'];

module.exports = async function handleProfile({ method, body, user, supabase, logger, normalizedRequest }) {
    const origin = normalizedRequest?.rawEvent?.headers?.origin || normalizedRequest?.rawEvent?.headers?.Origin;
    const headers = getCorsHeaders(origin);

    switch (method) {
        case 'GET': {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.cognitoId)
                .single();

            // If profile doesn't exist yet, auto-create it from Cognito claims
            if (error && error.code === 'PGRST116') {
                const newProfile = {
                    id: user.cognitoId,
                    email: user.email || null,
                    full_name: [user.given_name, user.family_name].filter(Boolean).join(' ') || user.name || null,
                    role: 'customer',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };
                const { data: created, error: createError } = await supabase
                    .from('profiles')
                    .upsert(newProfile, { onConflict: 'id' })
                    .select()
                    .single();
                if (createError) throw createError;
                return { statusCode: 200, body: JSON.stringify(created), headers };
            }
            if (error) throw error;
            return { statusCode: 200, body: JSON.stringify(data), headers };
        }
        case 'PUT': {
            // Filtrar solo campos permitidos — nunca dejar que el usuario modifique role, id, etc.
            const sanitizedBody = {};
            for (const key of ALLOWED_UPDATE_FIELDS) {
                if (body[key] !== undefined) {
                    sanitizedBody[key] = body[key];
                }
            }

            if (Object.keys(sanitizedBody).length === 0) {
                return { statusCode: 400, body: JSON.stringify({ error: 'No valid fields to update' }), headers };
            }

            sanitizedBody.updated_at = new Date().toISOString();

            const { data, error } = await supabase
                .from('profiles')
                .update(sanitizedBody)
                .eq('id', user.cognitoId)
                .select()
                .single();
            if (error) throw error;
            return { statusCode: 200, body: JSON.stringify(data), headers };
        }
        default:
            return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }), headers };
    }
};
