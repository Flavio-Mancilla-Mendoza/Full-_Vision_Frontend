const { supabase } = require('./shared/supabaseClient');
const { getCorsHeaders, handleCorsPreFlight } = require('./shared/cors');

exports.handler = async function (event) {
    const origin = event.headers?.origin || event.headers?.Origin;
    
    // Manejar OPTIONS para CORS preflight
    if (event.httpMethod === 'OPTIONS' || event.requestContext?.http?.method === 'OPTIONS') {
        return handleCorsPreFlight(origin);
    }
    
    try {
        const isHttpApi = event.version === '2.0' || Boolean(event.requestContext?.http?.method);
        const method = isHttpApi ? event.requestContext.http.method : event.httpMethod;
        const rawPath = isHttpApi ? event.rawPath : (event.path || event.resource);
        const pathParams = event.pathParameters || {};

        // /public/site-content
        if (method === 'GET' && (rawPath === '/public/site-content' || rawPath.startsWith('/public/site-content'))) {
            // Extract section from pathParameters or URL path
            let section = pathParams.section || null;
            if (!section) {
                const pathParts = rawPath.split('/').filter(Boolean);
                // ['public', 'site-content'] or ['public', 'site-content', 'hero']
                if (pathParts.length > 2 && pathParts[0] === 'public' && pathParts[1] === 'site-content') {
                    section = pathParts[2];
                }
            }
            if (section) {
                const { data, error } = await supabase.from('site_content').select('*').eq('section', section).order('sort_order', { ascending: true });
                if (error) throw error;
                return { statusCode: 200, body: JSON.stringify(data), headers: getCorsHeaders(origin) };
            }
            const { data, error } = await supabase.from('site_content').select('*').order('section', { ascending: true }).order('sort_order', { ascending: true });
            if (error) throw error;
            return { statusCode: 200, body: JSON.stringify(data), headers: getCorsHeaders(origin) };
        }

        // /public/bestsellers
        if (method === 'GET' && (rawPath === '/public/bestsellers' || rawPath.includes('bestsellers'))) {
            const { data, error } = await supabase
                .from('products')
                .select('*, brand:brands(id, name, slug)')
                .eq('is_bestseller', true)
                .eq('is_active', true)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return { statusCode: 200, body: JSON.stringify(data || []), headers: getCorsHeaders(origin) };
        }

        // /public/liquidacion - productos con descuento
        if (method === 'GET' && (rawPath === '/public/liquidacion' || rawPath.includes('liquidacion'))) {
            const { data, error } = await supabase
                .from('products')
                .select('*, brand:brands(id, name, slug)')
                .gt('discount_percentage', 0)
                .eq('is_active', true)
                .order('discount_percentage', { ascending: false });
            if (error) throw error;
            return { statusCode: 200, body: JSON.stringify(data || []), headers: getCorsHeaders(origin) };
        }

        // /public/products-by-gender - productos filtrados por género con paginación
        if (method === 'GET' && (rawPath === '/public/products-by-gender' || rawPath.includes('products-by-gender'))) {
            const params = event.queryStringParameters || {};
            const gender = params.gender;
            if (!gender) {
                return { statusCode: 400, body: JSON.stringify({ error: 'El parámetro gender es requerido' }), headers: getCorsHeaders(origin) };
            }
            
            const page = parseInt(params.page) || 1;
            const limit = Math.min(parseInt(params.limit) || 24, 100);
            const offset = (page - 1) * limit;
            const sortBy = params.sort_by || 'featured';
            
            // Query base
            let query = supabase
                .from('products')
                .select('*, brand:brands(id, name, slug)', { count: 'exact' })
                .eq('is_active', true)
                .eq('gender', gender);
            
            // Filtro de marcas
            const brands = [];
            Object.keys(params).forEach(key => {
                if (key === 'brands[]' || key.startsWith('brands[')) {
                    const val = params[key];
                    if (Array.isArray(val)) brands.push(...val);
                    else if (val) brands.push(val);
                }
            });
            // También soportar multiValueQueryStringParameters (API Gateway v1)
            if (event.multiValueQueryStringParameters) {
                const mv = event.multiValueQueryStringParameters['brands[]'];
                if (mv) brands.push(...mv);
            }
            if (brands.length > 0) {
                query = query.in('brand_id', brands);
            }
            
            // Filtro de descuento mínimo
            if (params.discount_min && parseFloat(params.discount_min) > 0) {
                query = query.gte('discount_percentage', parseFloat(params.discount_min));
            }
            
            // Filtro de rango de precio (usa precio efectivo: sale_price > discount > base_price)
            if (params.price_min && parseFloat(params.price_min) > 0) {
                const pMin = parseFloat(params.price_min);
                query = query.or(`sale_price.gte.${pMin},and(sale_price.is.null,base_price.gte.${pMin})`);
            }
            if (params.price_max && parseFloat(params.price_max) < 999999) {
                const pMax = parseFloat(params.price_max);
                query = query.or(`sale_price.lte.${pMax},and(sale_price.is.null,base_price.lte.${pMax})`);
            }
            
            // Ordenamiento
            switch (sortBy) {
                case 'price_asc':
                    query = query.order('base_price', { ascending: true });
                    break;
                case 'price_desc':
                    query = query.order('base_price', { ascending: false });
                    break;
                case 'discount':
                    query = query.order('discount_percentage', { ascending: false });
                    break;
                default: // featured
                    query = query.order('is_featured', { ascending: false }).order('created_at', { ascending: false });
            }
            
            // Paginación
            query = query.range(offset, offset + limit - 1);
            
            const { data, error, count } = await query;
            if (error) throw error;
            
            const total = count || 0;
            const totalPages = Math.ceil(total / limit);
            
            return {
                statusCode: 200,
                body: JSON.stringify({
                    products: data || [],
                    total,
                    page,
                    limit,
                    totalPages,
                    hasMore: page < totalPages,
                }),
                headers: getCorsHeaders(origin),
            };
        }

        // /public/filters/:gender - filtros dinámicos por género (Level 1: SQL optimizado)
        if (method === 'GET' && (rawPath.startsWith('/public/filters/') || rawPath.includes('/filters/'))) {
            const gender = pathParams.gender || rawPath.split('/filters/')[1];
            if (!gender) {
                return { statusCode: 400, body: JSON.stringify({ error: 'Género requerido' }), headers: getCorsHeaders(origin) };
            }
            
            // 3 queries SQL optimizadas en paralelo (GROUP BY / DISTINCT / MIN-MAX)
            const [brandsResult, discountsResult, priceResult] = await Promise.all([
                supabase.rpc('get_filter_brands', { p_gender: gender }),
                supabase.rpc('get_filter_discounts', { p_gender: gender }),
                supabase.rpc('get_filter_price_range', { p_gender: gender }),
            ]);

            if (brandsResult.error) throw brandsResult.error;
            if (discountsResult.error) throw discountsResult.error;
            if (priceResult.error) throw priceResult.error;

            const brands = (brandsResult.data || []).map(b => ({
                id: b.id,
                name: b.name,
                slug: b.slug,
                count: Number(b.product_count),
            }));

            const discounts = (discountsResult.data || []).map(d => Number(d.discount_value));

            const priceRow = (priceResult.data || [])[0];
            const priceRange = {
                min: priceRow ? Number(priceRow.min_price) : 0,
                max: priceRow ? Number(priceRow.max_price) : 1000,
            };

            return {
                statusCode: 200,
                body: JSON.stringify({ brands, discounts, priceRange }),
                headers: getCorsHeaders(origin),
            };
        }

        // /public/products/:slug - detalle de producto por slug
        if (method === 'GET' && rawPath.startsWith('/public/products/') && rawPath !== '/public/products-by-gender') {
            const slug = pathParams.slug || rawPath.split('/public/products/')[1];
            if (slug) {
                const { data, error } = await supabase
                    .from('products')
                    .select('*, brand:brands(id, name, slug), product_images(id, url, s3_key, alt_text, is_primary, sort_order)')
                    .eq('slug', slug)
                    .single();
                if (error) {
                    if (error.code === 'PGRST116') {
                        return { statusCode: 404, body: JSON.stringify({ error: 'Producto no encontrado' }), headers: getCorsHeaders(origin) };
                    }
                    throw error;
                }
                return { statusCode: 200, body: JSON.stringify(data), headers: getCorsHeaders(origin) };
            }
        }

        // /public/products - listado general
        if (method === 'GET' && rawPath === '/public/products') {
            const { data, error } = await supabase
                .from('products')
                .select('*, brand:brands(id, name, slug)')
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(100);
            if (error) throw error;
            return { statusCode: 200, body: JSON.stringify(data || []), headers: getCorsHeaders(origin) };
        }

        // /public/brands - listado de marcas activas
        if (method === 'GET' && rawPath === '/public/brands') {
            const { data, error } = await supabase
                .from('brands')
                .select('*')
                .eq('is_active', true)
                .order('name');
            if (error) throw error;
            return { statusCode: 200, body: JSON.stringify(data || []), headers: getCorsHeaders(origin) };
        }

        // /public/brands/check-exists - verificar si una marca existe
        if (method === 'POST' && rawPath === '/public/brands/check-exists') {
            const body = typeof event.body === 'string' ? JSON.parse(event.body || '{}') : (event.body || {});
            const { name } = body;
            if (!name) {
                return { statusCode: 400, body: JSON.stringify({ error: 'Brand name is required' }), headers: getCorsHeaders(origin) };
            }
            const { data } = await supabase
                .from('brands')
                .select('id, name')
                .ilike('name', name)
                .single();
            return { statusCode: 200, body: JSON.stringify({ exists: !!data, brand: data || null }), headers: getCorsHeaders(origin) };
        }

        // /mercadopago/{action} - MercadoPago integration
        if (method === 'POST' && rawPath.startsWith('/mercadopago/')) {
            const action = pathParams.action || rawPath.split('/mercadopago/')[1];
            const body = typeof event.body === 'string' ? JSON.parse(event.body || '{}') : (event.body || {});
            const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;
            const MERCADOPAGO_API_URL = 'https://api.mercadopago.com';

            if (action === 'create-preference') {
                try {
                    const { orderId, payer } = body;
                    if (!MERCADOPAGO_ACCESS_TOKEN) throw new Error('MERCADOPAGO_ACCESS_TOKEN not configured');
                    if (!orderId) throw new Error('Missing required field: orderId');
                    const frontendUrl = (process.env.FRONTEND_URL || 'https://full-vision-react.vercel.app').replace(/\/+$/, '');
                    console.log('MP create-preference for orderId:', orderId, 'frontendUrl:', frontendUrl);

                    // Look up order and items from DB — never trust frontend prices
                    const { data: order, error: orderError } = await supabase
                        .from('orders')
                        .select('id, order_number, total_amount, shipping_email, shipping_name')
                        .eq('id', orderId)
                        .single();

                    if (orderError || !order) throw new Error(`Order ${orderId} not found`);

                    const { data: orderItems, error: itemsError } = await supabase
                        .from('order_items')
                        .select('product_id, quantity, unit_price, products(name)')
                        .eq('order_id', orderId);

                    if (itemsError) throw new Error('Error fetching order items');
                    if (!orderItems || orderItems.length === 0) throw new Error('Order has no items');

                    const orderNumber = order.order_number;
                    console.log('Creating MP preference for order:', orderNumber);

                    // Build items from DB-verified prices
                    const mpItems = orderItems.map(item => ({
                        title: item.products?.name || 'Producto',
                        quantity: item.quantity,
                        unit_price: Number(item.unit_price),
                        currency_id: 'PEN',
                    }));

                    // Use payer from request or fall back to order data
                    const payerEmail = payer?.email || order.shipping_email;
                    if (!payerEmail) throw new Error('Payer email is required');

                    const apiGatewayUrl = (process.env.API_GATEWAY_URL || '').replace(/\/+$/, '');
                    const preferenceData = {
                        items: mpItems,
                        payer: { email: payerEmail, ...(payer?.name || order.shipping_name ? { name: payer?.name || order.shipping_name } : {}) },
                        back_urls: {
                            success: `${frontendUrl}/order-confirmation/${orderId}?payment=success`,
                            failure: `${frontendUrl}/checkout?payment=failure&order=${orderId}`,
                            pending: `${frontendUrl}/order-confirmation/${orderId}?payment=pending`,
                        },
                        auto_return: 'approved',
                        external_reference: orderId,
                        statement_descriptor: 'FULL VISION',
                        ...(apiGatewayUrl ? { notification_url: `${apiGatewayUrl}/mercadopago/webhook` } : {}),
                    };
                    console.log('MP preference request:', JSON.stringify(preferenceData, null, 2));
                    const response = await fetch(`${MERCADOPAGO_API_URL}/checkout/preferences`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}` },
                        body: JSON.stringify(preferenceData),
                    });
                    const responseText = await response.text();
                    if (!response.ok) {
                        console.error('MP API Error:', response.status, responseText);
                        return { statusCode: 500, body: JSON.stringify({ error: `Error de Mercado Pago (${response.status})`, details: responseText }), headers: getCorsHeaders(origin) };
                    }
                    const preference = JSON.parse(responseText);
                    console.log('Preference created:', preference.id);
                    return { statusCode: 200, body: JSON.stringify({ id: preference.id, init_point: preference.init_point, sandbox_init_point: preference.sandbox_init_point }), headers: getCorsHeaders(origin) };
                } catch (error) {
                    console.error('Error creating MP preference:', error);
                    return { statusCode: 500, body: JSON.stringify({ error: error.message || 'Internal server error' }), headers: getCorsHeaders(origin) };
                }
            }

            if (action === 'webhook') {
                try {
                    console.log('Webhook received from MercadoPago');
                    if (body.type !== 'payment') {
                        return { statusCode: 200, body: JSON.stringify({ ok: true }), headers: getCorsHeaders(origin) };
                    }
                    const paymentId = body.data?.id;
                    if (!paymentId) {
                        return { statusCode: 400, body: JSON.stringify({ error: 'No payment ID' }), headers: getCorsHeaders(origin) };
                    }
                    const mpResponse = await fetch(`${MERCADOPAGO_API_URL}/v1/payments/${paymentId}`, { headers: { 'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}` } });
                    if (!mpResponse.ok) throw new Error(`Error querying payment: ${mpResponse.status}`);
                    const payment = await mpResponse.json();
                    const orderId = payment.external_reference;
                    if (!orderId) {
                        return { statusCode: 400, body: JSON.stringify({ error: 'No orderId' }), headers: getCorsHeaders(origin) };
                    }
                    let orderStatus;
                    let adminNotes = `Mercado Pago ID: ${paymentId}`;
                    switch (payment.status) {
                        case 'approved': orderStatus = 'confirmed'; adminNotes += ' - Pago aprobado automáticamente'; break;
                        case 'pending': case 'in_process': orderStatus = 'pending'; adminNotes += ` - Pago pendiente (${payment.status})`; break;
                        case 'rejected': case 'cancelled': orderStatus = 'cancelled'; adminNotes += ` - Pago ${payment.status}`; break;
                        default: orderStatus = 'pending'; adminNotes += ` - Estado desconocido: ${payment.status}`;
                    }

                    // Read previous order state BEFORE updating (needed for stock restore logic)
                    const { data: prevOrder } = await supabase
                        .from('orders')
                        .select('status, user_id')
                        .eq('id', orderId)
                        .single();

                    const { error: updateError } = await supabase.from('orders').update({ status: orderStatus, admin_notes: adminNotes, payment_method: 'mercadopago', payment_status: payment.status, transaction_id: paymentId }).eq('id', orderId);
                    if (updateError) throw updateError;

                    // --- Post-payment stock & cart handling ---
                    if (payment.status === 'approved') {
                        // Fetch order items to decrement stock
                        const { data: orderItems } = await supabase
                            .from('order_items')
                            .select('product_id, quantity')
                            .eq('order_id', orderId);

                        if (orderItems && orderItems.length > 0) {
                            for (const item of orderItems) {
                                const { data: product } = await supabase
                                    .from('products')
                                    .select('stock_quantity')
                                    .eq('id', item.product_id)
                                    .single();

                                const currentStock = product?.stock_quantity ?? 0;
                                const newStock = Math.max(0, currentStock - item.quantity);
                                const updateData = {
                                    stock_quantity: newStock,
                                    updated_at: new Date().toISOString(),
                                };
                                if (newStock === 0) {
                                    updateData.is_active = false;
                                }
                                await supabase
                                    .from('products')
                                    .update(updateData)
                                    .eq('id', item.product_id);
                            }
                        }

                        // Clear the user's cart after successful payment
                        if (prevOrder?.user_id) {
                            await supabase
                                .from('cart_items')
                                .delete()
                                .eq('user_id', prevOrder.user_id);
                        }
                        console.log(`Payment approved for order ${orderId}: stock decremented, cart cleared`);
                    } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
                        // Restore stock if order was previously confirmed (e.g. chargeback/reversal)
                        const stockDecrementedStatuses = ['confirmed', 'processing', 'ready_for_pickup', 'shipped', 'delivered'];
                        if (prevOrder && stockDecrementedStatuses.includes(prevOrder.status)) {
                            const { data: orderItems } = await supabase
                                .from('order_items')
                                .select('product_id, quantity')
                                .eq('order_id', orderId);

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
                                        if (!product.is_active && product.stock_quantity === 0) {
                                            updateData.is_active = true;
                                        }
                                        await supabase.from('products').update(updateData).eq('id', item.product_id);
                                    }
                                }
                                console.log(`Payment ${payment.status} for order ${orderId}: stock restored (${orderItems.length} products)`);
                            }
                        } else {
                            console.log(`Payment ${payment.status} for order ${orderId}: stock never decremented, nothing to restore`);
                        }
                    }

                    return { statusCode: 200, body: JSON.stringify({ ok: true }), headers: getCorsHeaders(origin) };
                } catch (error) {
                    console.error('Error processing MP webhook:', error);
                    return { statusCode: 500, body: JSON.stringify({ error: error.message || 'Internal server error' }), headers: getCorsHeaders(origin) };
                }
            }

            return { statusCode: 404, body: JSON.stringify({ error: 'Unknown mercadopago action' }), headers: getCorsHeaders(origin) };
        }

        return { statusCode: 404, body: JSON.stringify({ error: 'Not found' }), headers: getCorsHeaders(origin) };
    } catch (err) {
        console.error('public lambda error', err);
        return { statusCode: 500, body: JSON.stringify({ error: err.message || 'Internal error' }), headers: getCorsHeaders(origin) };
    }
};
