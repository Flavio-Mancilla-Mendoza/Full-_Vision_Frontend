        /**
 * Admin User Management Lambda
 * Operaciones CRUD de usuarios vía Cognito User Pool (solo admin)
 *
 * Runtime: Node.js 20.x (CommonJS)
 */

const {
    CognitoIdentityProviderClient,
    ListUsersCommand,
    AdminGetUserCommand,
    AdminCreateUserCommand,
    AdminDeleteUserCommand,
    AdminDisableUserCommand,
    AdminEnableUserCommand,
    AdminAddUserToGroupCommand,
    AdminRemoveUserFromGroupCommand,
    AdminListGroupsForUserCommand,
} = require('@aws-sdk/client-cognito-identity-provider');

const cognitoClient = new CognitoIdentityProviderClient({
    region: process.env.AWS_REGION || 'sa-east-1',
});

const USER_POOL_ID = process.env.USER_POOL_ID;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');

function getCorsHeaders(origin) {
    const allowedOrigin = ALLOWED_ORIGINS.find(o => o.trim() === origin) || ALLOWED_ORIGINS[0];
    return {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Content-Type': 'application/json',
    };
}

function response(statusCode, body, origin) {
    return {
        statusCode,
        headers: getCorsHeaders(origin),
        body: JSON.stringify(body),
    };
}

exports.handler = async (event) => {
    const origin = event.headers?.origin || event.headers?.Origin || '';
    const method = event.requestContext?.http?.method || event.httpMethod;
    const path = event.rawPath || event.path || '';

    console.log('[INFO] Admin user management:', method, path);

    if (method === 'OPTIONS') {
        return response(200, {}, origin);
    }

    if (!USER_POOL_ID) {
        return response(500, { error: 'USER_POOL_ID not configured' }, origin);
    }

    try {
        // GET /users - Listar usuarios
        if (method === 'GET' && path.endsWith('/users')) {
            const limit = parseInt(event.queryStringParameters?.limit || '20', 10);
            const token = event.queryStringParameters?.token || undefined;

            const command = new ListUsersCommand({
                UserPoolId: USER_POOL_ID,
                Limit: Math.min(limit, 60),
                PaginationToken: token,
            });
            const result = await cognitoClient.send(command);

            return response(200, {
                users: (result.Users || []).map(formatUser),
                nextToken: result.PaginationToken || null,
            }, origin);
        }

        // GET /users/{userId} - Obtener un usuario
        if (method === 'GET' && path.match(/\/users\/[^/]+$/)) {
            const userId = path.split('/').pop();
            const command = new AdminGetUserCommand({
                UserPoolId: USER_POOL_ID,
                Username: userId,
            });
            const result = await cognitoClient.send(command);

            // Obtener grupos del usuario
            const groupsCommand = new AdminListGroupsForUserCommand({
                UserPoolId: USER_POOL_ID,
                Username: userId,
            });
            const groupsResult = await cognitoClient.send(groupsCommand);

            return response(200, {
                ...formatUser(result),
                groups: (groupsResult.Groups || []).map(g => g.GroupName),
            }, origin);
        }

        // POST /users - Crear usuario
        if (method === 'POST' && path.endsWith('/users')) {
            const body = JSON.parse(event.body || '{}');
            const { email, givenName, familyName, temporaryPassword, group } = body;

            if (!email) {
                return response(400, { error: 'Email is required' }, origin);
            }

            const command = new AdminCreateUserCommand({
                UserPoolId: USER_POOL_ID,
                Username: email,
                UserAttributes: [
                    { Name: 'email', Value: email },
                    { Name: 'email_verified', Value: 'true' },
                    ...(givenName ? [{ Name: 'given_name', Value: givenName }] : []),
                    ...(familyName ? [{ Name: 'family_name', Value: familyName }] : []),
                ],
                TemporaryPassword: temporaryPassword,
                DesiredDeliveryMediums: ['EMAIL'],
            });
            await cognitoClient.send(command);

            // Agregar a grupo si se especifica
            if (group) {
                const groupCommand = new AdminAddUserToGroupCommand({
                    UserPoolId: USER_POOL_ID,
                    Username: email,
                    GroupName: group,
                });
                await cognitoClient.send(groupCommand);
            }

            return response(201, { message: `User ${email} created successfully` }, origin);
        }

        // DELETE /users/{userId} - Eliminar usuario
        if (method === 'DELETE' && path.match(/\/users\/[^/]+$/)) {
            const userId = path.split('/').pop();
            const command = new AdminDeleteUserCommand({
                UserPoolId: USER_POOL_ID,
                Username: userId,
            });
            await cognitoClient.send(command);
            return response(200, { message: `User ${userId} deleted` }, origin);
        }

        // PUT /users/{userId}/disable - Deshabilitar usuario
        if (method === 'PUT' && path.match(/\/users\/[^/]+\/disable$/)) {
            const userId = path.split('/').slice(-2, -1)[0];
            await cognitoClient.send(new AdminDisableUserCommand({
                UserPoolId: USER_POOL_ID,
                Username: userId,
            }));
            return response(200, { message: `User ${userId} disabled` }, origin);
        }

        // PUT /users/{userId}/enable - Habilitar usuario
        if (method === 'PUT' && path.match(/\/users\/[^/]+\/enable$/)) {
            const userId = path.split('/').slice(-2, -1)[0];
            await cognitoClient.send(new AdminEnableUserCommand({
                UserPoolId: USER_POOL_ID,
                Username: userId,
            }));
            return response(200, { message: `User ${userId} enabled` }, origin);
        }

        return response(404, { error: 'Route not found' }, origin);

    } catch (error) {
        console.error('[ERROR]', error);
        return response(error.$metadata?.httpStatusCode || 500, {
            error: error.message || 'Internal server error',
        }, origin);
    }
};

function formatUser(user) {
    const attrs = {};
    (user.UserAttributes || user.Attributes || []).forEach(attr => {
        attrs[attr.Name] = attr.Value;
    });
    return {
        username: user.Username,
        email: attrs.email || '',
        givenName: attrs.given_name || '',
        familyName: attrs.family_name || '',
        status: user.UserStatus,
        enabled: user.Enabled,
        created: user.UserCreateDate,
        modified: user.UserLastModifiedDate,
    };
}
