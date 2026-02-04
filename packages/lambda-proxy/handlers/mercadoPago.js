// Handler modularizado para Mercado Pago
export default async function handleMercadoPago({ method, pathParameters, body, user, supabase, logger }) {
    const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;
    const MERCADOPAGO_API_URL = 'https://api.mercadopago.com';
    switch (method) {
        case 'POST': {
            if (pathParameters?.action === 'create-preference') {
                try {
                    const { orderId, orderNumber, items, totalAmount, payer, back_urls } = body;
                    logger.info('Creating MP preference for order:', orderNumber);
                    if (!MERCADOPAGO_ACCESS_TOKEN) throw new Error('MERCADOPAGO_ACCESS_TOKEN not configured');
                    if (!orderId || !orderNumber || !items || items.length === 0) throw new Error('Missing required fields: orderId, orderNumber, items');
                    if (!payer || !payer.email) throw new Error('Payer email is required');
                    const preferenceData = {
                        items: items.map(item => ({ title: item.title, quantity: item.quantity, unit_price: Number(item.unit_price), currency_id: 'PEN' })),
                        payer: { email: payer.email, ...(payer.name && { name: payer.name }) },
                        back_urls: back_urls || {
                            success: `${process.env.FRONTEND_URL}/order-confirmation/${orderId}`,
                            failure: `${process.env.FRONTEND_URL}/checkout?error=payment_failed`,
                            pending: `${process.env.FRONTEND_URL}/order-confirmation/${orderId}?pending=true`,
                        },
                        auto_return: 'approved',
                        external_reference: orderId,
                        statement_descriptor: 'FULL VISION',
                        notification_url: `${process.env.API_GATEWAY_URL}/mercadopago/webhook`,
                    };
                    logger.debug('Preference data:', preferenceData);
                    const response = await fetch(`${MERCADOPAGO_API_URL}/checkout/preferences`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}` },
                        body: JSON.stringify(preferenceData),
                    });
                    const responseText = await response.text();
                    logger.debug('MP Response status:', response.status);
                    if (!response.ok) {
                        logger.error('MP API Error:', response.status, responseText);
                        return { statusCode: 500, body: JSON.stringify({ error: `Error de Mercado Pago (${response.status})`, details: responseText }) };
                    }
                    const preference = JSON.parse(responseText);
                    logger.info('Preference created:', preference.id);
                    return { statusCode: 200, body: JSON.stringify({ id: preference.id, init_point: preference.init_point, sandbox_init_point: preference.sandbox_init_point }) };
                } catch (error) {
                    logger.error('Error creating MP preference:', error);
                    return { statusCode: 500, body: JSON.stringify({ error: error.message || 'Internal server error' }) };
                }
            }
            if (pathParameters?.action === 'webhook') {
                try {
                    logger.info('Webhook received from MercadoPago');
                    logger.debug('Webhook body:', body);
                    if (body.type !== 'payment') {
                        logger.info('Ignored notification type:', body.type);
                        return { statusCode: 200, body: JSON.stringify({ ok: true }) };
                    }
                    const paymentId = body.data?.id;
                    if (!paymentId) {
                        logger.error('No payment ID in webhook');
                        return { statusCode: 400, body: JSON.stringify({ error: 'No payment ID' }) };
                    }
                    logger.info('Payment ID:', paymentId);
                    const mpResponse = await fetch(`${MERCADOPAGO_API_URL}/v1/payments/${paymentId}`, { headers: { 'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}` } });
                    if (!mpResponse.ok) throw new Error(`Error querying payment: ${mpResponse.status}`);
                    const payment = await mpResponse.json();
                    logger.info('Payment status:', payment.status);
                    logger.info('External reference (orderId):', payment.external_reference);
                    const orderId = payment.external_reference;
                    if (!orderId) {
                        logger.error('No external_reference (orderId) found');
                        return { statusCode: 400, body: JSON.stringify({ error: 'No orderId' }) };
                    }
                    let orderStatus;
                    let adminNotes = `Mercado Pago ID: ${paymentId}`;
                    switch (payment.status) {
                        case 'approved':
                            orderStatus = 'confirmed';
                            adminNotes += ' - Pago aprobado automáticamente';
                            logger.info('Payment approved - confirming order');
                            break;
                        case 'pending':
                        case 'in_process':
                            orderStatus = 'pending';
                            adminNotes += ` - Pago pendiente (${payment.status})`;
                            logger.info('Payment pending');
                            break;
                        case 'rejected':
                        case 'cancelled':
                            orderStatus = 'cancelled';
                            adminNotes += ` - Pago ${payment.status}`;
                            logger.info('Payment rejected/cancelled - cancelling order');
                            break;
                        default:
                            orderStatus = 'pending';
                            adminNotes += ` - Estado desconocido: ${payment.status}`;
                            logger.warn('Unknown payment status:', payment.status);
                    }
                    const { error: updateError } = await supabase.from('orders').update({ status: orderStatus, admin_notes: adminNotes, payment_method: 'mercadopago', payment_status: payment.status, transaction_id: paymentId }).eq('id', orderId);
                    if (updateError) {
                        logger.error('Error updating order:', updateError);
                        throw updateError;
                    }
                    logger.info('Order updated successfully');
                    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
                } catch (error) {
                    logger.error('Error processing webhook:', error);
                    return { statusCode: 500, body: JSON.stringify({ error: error.message || 'Internal server error' }) };
                }
            }
            return { statusCode: 404, body: JSON.stringify({ error: 'Not found' }) };
        }
        default:
            return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }
};
