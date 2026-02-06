/**
 * Post Confirmation Lambda Trigger para Cognito
 * Crea el perfil del usuario en Supabase después de confirmar su email
 *
 * Runtime: Node.js 20.x (CommonJS)
 * Trigger: PostConfirmation_ConfirmSignUp
 */

const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

const secretsClient = new SecretsManagerClient({ region: process.env.AWS_REGION || 'sa-east-1' });

let supabaseClient = null;

/**
 * Obtiene las credenciales de Supabase desde Secrets Manager o env vars
 */
async function getSupabaseCredentials() {
    // Intentar desde environment variables primero
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return {
            url: process.env.SUPABASE_URL,
            serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        };
    }

    // Fallback a Secrets Manager
    const secretName = process.env.SUPABASE_SECRET_NAME || 'full-vision/supabase';
    try {
        const command = new GetSecretValueCommand({ SecretId: secretName });
        const response = await secretsClient.send(command);
        const secret = JSON.parse(response.SecretString);
        return {
            url: secret.SUPABASE_URL,
            serviceRoleKey: secret.SUPABASE_SERVICE_ROLE_KEY,
        };
    } catch (error) {
        console.error('[ERROR] Failed to retrieve Supabase credentials:', error.message);
        throw error;
    }
}

/**
 * Inicializa el cliente de Supabase (con cache)
 */
async function getSupabase() {
    if (supabaseClient) return supabaseClient;

    // Importar dinámicamente ya que puede no estar disponible
    let createClient;
    try {
        const supabaseModule = require('@supabase/supabase-js');
        createClient = supabaseModule.createClient;
    } catch (err) {
        console.error('[ERROR] @supabase/supabase-js not available:', err.message);
        throw new Error('Supabase client library not installed');
    }

    const credentials = await getSupabaseCredentials();
    supabaseClient = createClient(credentials.url, credentials.serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });

    return supabaseClient;
}

exports.handler = async (event) => {
    console.log('[INFO] Post-confirmation trigger invoked:', JSON.stringify({
        triggerSource: event.triggerSource,
        userName: event.userName,
        userPoolId: event.userPoolId,
    }));

    // Solo procesar confirmaciones de signup
    if (event.triggerSource !== 'PostConfirmation_ConfirmSignUp') {
        console.log('[INFO] Skipping non-signup confirmation:', event.triggerSource);
        return event;
    }

    const { sub, email, given_name, family_name } = event.request.userAttributes;

    try {
        const supabase = await getSupabase();

        // Crear perfil en la tabla profiles
        const { data, error } = await supabase
            .from('profiles')
            .upsert({
                id: sub,
                email: email,
                first_name: given_name || '',
                last_name: family_name || '',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'id',
            });

        if (error) {
            console.error('[ERROR] Failed to create profile:', error);
            // No lanzar error para no bloquear el flujo de Cognito
        } else {
            console.log('[INFO] Profile created/updated for:', email);
        }
    } catch (error) {
        console.error('[ERROR] Post-confirmation handler error:', error);
        // No lanzar error para no bloquear el flujo de Cognito
    }

    return event;
};
