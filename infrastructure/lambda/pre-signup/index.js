/**
 * Pre Sign-Up Lambda Trigger para Cognito
 * Valida datos del usuario antes del registro
 *
 * Runtime: Node.js 20.x (CommonJS)
 * Trigger: PreSignUp_SignUp
 */

exports.handler = async (event) => {
    console.log('[INFO] Pre-signup trigger invoked:', JSON.stringify({
        triggerSource: event.triggerSource,
        userName: event.userName,
        userPoolId: event.userPoolId,
    }));

    const { email, given_name, family_name } = event.request.userAttributes;

    // Validar que el email esté presente
    if (!email) {
        throw new Error('El email es obligatorio para el registro.');
    }

    // Validar formato de email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new Error('El formato del email no es válido.');
    }

    // Validar que nombre y apellido estén presentes
    if (!given_name || !family_name) {
        throw new Error('El nombre y apellido son obligatorios.');
    }

    // No auto-confirmar ni auto-verificar (flujo normal con email de verificación)
    event.response.autoConfirmUser = false;
    event.response.autoVerifyEmail = false;
    event.response.autoVerifyPhone = false;

    console.log('[INFO] Pre-signup validation passed for:', email);

    return event;
};
