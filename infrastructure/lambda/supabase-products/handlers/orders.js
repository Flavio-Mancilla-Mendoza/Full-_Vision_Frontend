// Handler modularizado para órdenes
const { calculateFinalPrice } = require('../lib/product-utils');
const { getCorsHeaders } = require('../shared/cors');

// Validate order items and calculate prices from DB (never trust frontend prices)
async function validateAndCalculateOrderItems(items, supabase) {
    if (!items || !Array.isArray(items) || items.length === 0) {
        throw new Error('Order must have at least one item');
    }

    const calculatedItems = [];
    for (const item of items) {
        if (!item.product_id || !item.quantity || item.quantity < 1) {
            throw new Error('Each item must have product_id and quantity >= 1');
        }

        // Obtener precio real desde la DB — nunca confiar en el precio del frontend
        const { data: product, error } = await supabase
            .from('products')
            .select('id, name, base_price, sale_price, discount_percentage, stock_quantity, is_active')
            .eq('id', item.product_id)
            .single();

        if (error || !product) {
            throw new Error(`Product ${item.product_id} not found`);
        }
        if (!product.is_active) {
            throw new Error(`Product ${item.product_id} is not available`);
        }
        if (product.stock_quantity != null && product.stock_quantity < item.quantity) {
            throw new Error(`Insufficient stock for product ${item.product_id}. Available: ${product.stock_quantity}, Requested: ${item.quantity}`);
        }

        const unitPrice = calculateFinalPrice(product);
        calculatedItems.push({
            product_id: item.product_id,
            product_name: product.name,
            quantity: item.quantity,
            unit_price: unitPrice,
            total_price: Math.round(unitPrice * item.quantity * 100) / 100,
            prescription_details: item.prescription_details || null,
            special_instructions: item.special_instructions || null,
        });
    }

    return calculatedItems;
}

// Generate unique order number
function generateOrderNumber() {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `FV${year}${month}${day}-${random}`;
}

// Send confirmation email via Supabase Edge Function (server-side with SERVICE_ROLE)
async function sendConfirmationEmail({ order, shippingInfo, paymentMethod, items, supabase, logger }) {
    try {
        const supabaseUrl = process.env.SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceRoleKey) {
            logger.warn('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for email sending');
            return;
        }

        const response = await fetch(`${supabaseUrl}/functions/v1/send-order-confirmation`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${serviceRoleKey}`,
            },
            body: JSON.stringify({
                order_number: order.order_number,
                customer_name: shippingInfo.name,
                customer_email: shippingInfo.email,
                customer_phone: shippingInfo.phone,
                total_amount: order.total_amount,
                subtotal: order.subtotal,
                tax_amount: order.tax_amount,
                shipping_amount: order.shipping_amount,
                shipping_address: shippingInfo.address || null,
                shipping_city: shippingInfo.city || null,
                customer_dni: shippingInfo.dni || null,
                payment_method: paymentMethod,
                items: items.map(item => ({
                    name: item.product_name || 'Producto',
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    total_price: item.total_price,
                })),
            }),
        });

        if (!response.ok) {
            const text = await response.text();
            logger.warn('Email sending returned non-OK status:', response.status, text);
        } else {
            logger.info('Confirmation email sent for order', order.order_number);
        }
    } catch (emailError) {
        logger.error('Error sending confirmation email:', emailError);
        // No lanzar error — la orden ya se creó correctamente
    }
}

// POST /orders/checkout — Full checkout flow with server-side price calculation
async function handleCheckout({ body, user, supabase, logger }) {
    const { items, shippingInfo, paymentMethod, customerNotes, deliveryMethod } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Items are required' }) };
    }
    if (!shippingInfo || !shippingInfo.name || !shippingInfo.email || !shippingInfo.phone) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Shipping info (name, email, phone) is required' }) };
    }
    if (!paymentMethod) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Payment method is required' }) };
    }

    // 1. Validate items and get real prices from DB
    const validatedItems = await validateAndCalculateOrderItems(items, supabase);

    // 2. Calculate totals server-side
    // Prices are IGV-inclusive (18% Peru tax). Extract tax from total, don't add on top.
    const grossTotal = validatedItems.reduce((sum, item) => sum + item.total_price, 0);
    const taxRate = 0.18;
    const taxAmount = Math.round(grossTotal * (taxRate / (1 + taxRate)) * 100) / 100;
    const subtotal = Math.round((grossTotal - taxAmount) * 100) / 100;
    const shippingAmount = deliveryMethod === 'pickup' ? 0 : (grossTotal >= 300 ? 0 : 25);
    const totalAmount = Math.round((grossTotal + shippingAmount) * 100) / 100;

    const orderNumber = generateOrderNumber();

    // 3. Create order
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
            user_id: user.cognitoId,
            order_number: orderNumber,
            status: 'pending',
            subtotal,
            tax_amount: taxAmount,
            shipping_amount: shippingAmount,
            total_amount: totalAmount,
            shipping_name: shippingInfo.name,
            shipping_email: shippingInfo.email,
            shipping_phone: shippingInfo.phone,
            shipping_address: shippingInfo.address || null,
            shipping_city: shippingInfo.city || null,
            shipping_postal_code: shippingInfo.postal_code || null,
            customer_dni: shippingInfo.dni || null,
            billing_name: shippingInfo.name,
            billing_email: shippingInfo.email,
            customer_notes: customerNotes || null,
            admin_notes: `Método de pago: ${paymentMethod}`,
            payment_method: paymentMethod,
            payment_status: paymentMethod === 'mercadopago' ? 'pending' : 'pending',
        }])
        .select()
        .single();

    if (orderError) {
        logger.error('Error creating order:', orderError);
        throw orderError;
    }

    // 4. Insert order items with server-verified prices
    const orderItems = validatedItems.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        prescription_details: item.prescription_details,
        special_instructions: item.special_instructions,
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
    if (itemsError) {
        logger.error('Error inserting order items:', itemsError);
        throw itemsError;
    }

    // 5. Stock & cart are NOT modified here.
    //    Stock is decremented and cart is cleared by the MercadoPago webhook
    //    ONLY when the payment is approved. This prevents losing stock/cart
    //    when the user cancels or the payment fails.

    // 6. Send confirmation email (async, non-blocking)
    sendConfirmationEmail({
        order,
        shippingInfo,
        paymentMethod,
        items: validatedItems,
        supabase,
        logger,
    }).catch(err => logger.warn('Email sending failed silently:', err.message));

    return {
        statusCode: 201,
        body: JSON.stringify({
            id: order.id,
            order_number: order.order_number,
            status: order.status,
            subtotal,
            tax_amount: taxAmount,
            shipping_amount: shippingAmount,
            total_amount: totalAmount,
            payment_method: paymentMethod,
        }),
    };
}

module.exports = async function handleOrders({ method, pathParameters, body, user, supabase, processProductImages, addDiscountToProduct, logger, normalizedRequest }) {
    const origin = normalizedRequest?.rawEvent?.headers?.origin || normalizedRequest?.rawEvent?.headers?.Origin;

    switch (method) {
        case 'GET': {
            // GET /orders/counts — Aggregate status counts (admin: all, user: own)
            const requestPath = normalizedRequest?.path || '';
            if (requestPath.endsWith('/counts')) {
                const isAdmin = user.groups && (user.groups.includes('Admins') || user.groups.includes('admin'));
                let query = supabase.from('orders').select('status');
                if (!isAdmin) {
                    query = query.eq('user_id', user.cognitoId);
                }
                const { data: rows, error: countError } = await query;
                if (countError) throw countError;

                const counts = {
                    all: rows.length,
                    pending: 0,
                    confirmed: 0,
                    processing: 0,
                    ready_for_pickup: 0,
                    shipped: 0,
                    delivered: 0,
                    cancelled: 0,
                };
                for (const row of rows) {
                    if (counts[row.status] !== undefined) {
                        counts[row.status]++;
                    }
                }
                return { statusCode: 200, body: JSON.stringify(counts), headers: getCorsHeaders(origin) };
            }

            if (pathParameters?.id) {
                const { data, error } = await supabase.from('orders').select('*, order_items(*)').eq('id', pathParameters.id).maybeSingle();
                if (error) throw error;
                if (!data) {
                    return { statusCode: 404, body: JSON.stringify({ error: 'Order not found' }), headers: getCorsHeaders(origin) };
                }
                if (data.user_id !== user.cognitoId && !(user.groups && (user.groups.includes('Admins') || user.groups.includes('admin')))) {
                    return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden' }), headers: getCorsHeaders(origin) };
                }
                return { statusCode: 200, body: JSON.stringify(data), headers: getCorsHeaders(origin) };
            } else {
                const isAdmin = user.groups && (user.groups.includes('Admins') || user.groups.includes('admin'));
                logger.debug('Fetching orders:', { userGroups: user.groups, isAdmin, cognitoId: user.cognitoId });
                let query = supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false });
                if (!isAdmin) {
                    logger.debug('Not admin, filtering by user_id:', user.cognitoId);
                    query = query.eq('user_id', user.cognitoId);
                } else {
                    logger.debug('Admin user, fetching all orders');
                }
                const { data, error } = await query;
                if (error) throw error;
                logger.debug('Orders fetched:', { count: data?.length });
                return { statusCode: 200, body: JSON.stringify(data), headers: getCorsHeaders(origin) };
            }
        }
        case 'POST': {
            try {
                // Full checkout flow: /orders/checkout
                const path = normalizedRequest?.path || '';
                if (path.endsWith('/checkout') || pathParameters?.action === 'checkout') {
                    const result = await handleCheckout({ body, user, supabase, logger });
                    return { ...result, headers: getCorsHeaders(origin) };
                }

                // Legacy/generic order creation (kept for backwards compatibility)
                let validatedItems = null;
                if (body.items && Array.isArray(body.items)) {
                    validatedItems = await validateAndCalculateOrderItems(body.items, supabase);
                }
                const subtotal = validatedItems
                    ? validatedItems.reduce((sum, item) => sum + item.total_price, 0)
                    : (Number(body.subtotal) || 0);
                const taxAmount = Number(body.tax_amount) || Math.round(subtotal * 0.18 * 100) / 100;
                const shippingAmount = Number(body.shipping_amount) || (subtotal >= 300 ? 0 : 25);
                const totalAmount = Math.round((subtotal + taxAmount + shippingAmount) * 100) / 100;

                const orderData = {
                    user_id: user.cognitoId,
                    email: user.email,
                    order_number: body.order_number || generateOrderNumber(),
                    status: 'pending',
                    subtotal,
                    tax_amount: taxAmount,
                    shipping_amount: shippingAmount,
                    total_amount: totalAmount,
                    shipping_name: body.shipping_name || null,
                    shipping_email: body.shipping_email || null,
                    shipping_phone: body.shipping_phone || null,
                    shipping_address: body.shipping_address || null,
                    shipping_city: body.shipping_city || null,
                    shipping_postal_code: body.shipping_postal_code || null,
                    customer_dni: body.customer_dni || null,
                    billing_name: body.billing_name || null,
                    billing_email: body.billing_email || null,
                    customer_notes: body.customer_notes || null,
                    admin_notes: body.admin_notes || null,
                };
                const { data: order, error: orderError } = await supabase.from('orders').insert(orderData).select().single();
                if (orderError) throw orderError;
                if (validatedItems && validatedItems.length > 0) {
                    const itemsToInsert = validatedItems.map(item => ({ ...item, order_id: order.id }));
                    const { error: itemsError } = await supabase.from('order_items').insert(itemsToInsert);
                    if (itemsError) throw itemsError;
                }
                return { statusCode: 201, body: JSON.stringify(order), headers: getCorsHeaders(origin) };
            } catch (err) {
                logger.error('Error creating order:', err);
                return { statusCode: 400, body: JSON.stringify({ error: err.message }), headers: getCorsHeaders(origin) };
            }
        }
        case 'PUT': {
            if (!pathParameters?.id) {
                return { statusCode: 400, body: JSON.stringify({ error: 'Order ID is required' }), headers: getCorsHeaders(origin) };
            }
            const { data: existingOrder } = await supabase.from('orders').select('user_id, status').eq('id', pathParameters.id).maybeSingle();
            if (!existingOrder) {
                return { statusCode: 404, body: JSON.stringify({ error: 'Order not found' }), headers: getCorsHeaders(origin) };
            }
            const isAdmin = user.groups && (user.groups.includes('Admins') || user.groups.includes('admin'));
            if (existingOrder.user_id !== user.cognitoId && !isAdmin) {
                return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden' }), headers: getCorsHeaders(origin) };
            }
            // Whitelist: only admins can change status/admin_notes, users can only update customer_notes
            const ADMIN_ALLOWED = ['status', 'admin_notes', 'customer_notes', 'shipping_name', 'shipping_email', 'shipping_phone', 'shipping_address', 'shipping_city', 'shipping_postal_code'];
            const USER_ALLOWED = ['customer_notes'];
            const allowedFields = isAdmin ? ADMIN_ALLOWED : USER_ALLOWED;
            const sanitized = {};
            for (const key of allowedFields) {
                if (body[key] !== undefined) sanitized[key] = body[key];
            }
            sanitized.updated_at = new Date().toISOString();

            // Restore stock when an order that had stock decremented is cancelled
            const stockDecrementedStatuses = ['confirmed', 'processing', 'ready_for_pickup', 'shipped', 'delivered'];
            if (body.status === 'cancelled' && stockDecrementedStatuses.includes(existingOrder.status)) {
                const { data: orderItems } = await supabase
                    .from('order_items')
                    .select('product_id, quantity')
                    .eq('order_id', pathParameters.id);

                if (orderItems && orderItems.length > 0) {
                    for (const item of orderItems) {
                        const { data: product } = await supabase
                            .from('products')
                            .select('stock_quantity, is_active')
                            .eq('id', item.product_id)
                            .single();

                        if (product) {
                            const restoredStock = (product.stock_quantity ?? 0) + item.quantity;
                            const updateData = {
                                stock_quantity: restoredStock,
                                updated_at: new Date().toISOString(),
                            };
                            // Reactivate product if it was deactivated due to zero stock
                            if (!product.is_active && product.stock_quantity === 0) {
                                updateData.is_active = true;
                            }
                            await supabase.from('products').update(updateData).eq('id', item.product_id);
                        }
                    }
                    logger.info(`Stock restored for cancelled order ${pathParameters.id} (${orderItems.length} products)`);
                }
            }

            const { data, error } = await supabase.from('orders').update(sanitized).eq('id', pathParameters.id).select().single();
            if (error) throw error;
            return { statusCode: 200, body: JSON.stringify(data), headers: getCorsHeaders(origin) };
        }
        default:
            return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }), headers: getCorsHeaders(origin) };
    }
};

