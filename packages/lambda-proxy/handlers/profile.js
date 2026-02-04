// Handler modularizado para perfil de usuario
export default async function handleProfile({ method, body, user, supabase, logger }) {
    switch (method) {
        case 'GET': {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('cognito_id', user.cognitoId)
                .single();
            if (error) throw error;
            return { statusCode: 200, body: JSON.stringify(data) };
        }
        case 'PUT': {
            const { data, error } = await supabase
                .from('profiles')
                .update(body)
                .eq('cognito_id', user.cognitoId)
                .select()
                .single();
            if (error) throw error;
            return { statusCode: 200, body: JSON.stringify(data) };
        }
        default:
            return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }
};
