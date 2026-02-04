// Extraer usuario desde JWT de Cognito y utilidades de autorización (ESM)
export function getUserFromCognito(normalizedRequest, logger = console) {
    const claims = normalizedRequest.claims;
    if (!claims) return null;

    let groups = [];
    if (claims['cognito:groups']) {
        if (typeof claims['cognito:groups'] === 'string') {
            groups = claims['cognito:groups'].split(',');
        } else if (Array.isArray(claims['cognito:groups'])) {
            groups = claims['cognito:groups'];
        }
    }

    return {
        cognitoId: claims.sub,
        email: claims.email,
        email_verified: claims.email_verified === 'true' || claims.email_verified === true,
        name: claims.name || '',
        given_name: claims.given_name || '',
        family_name: claims.family_name || '',
        groups: groups,
    };
}

export function isAdminUser(user) {
    if (!user || !user.groups) return false;
    const groups = Array.isArray(user.groups) ? user.groups : String(user.groups).split(',');
    return groups.some(g => {
        if (!g) return false;
        const normalized = String(g).toLowerCase().trim();
        return normalized === 'admin' || normalized === 'admins';
    });
}

export default { getUserFromCognito, isAdminUser };
