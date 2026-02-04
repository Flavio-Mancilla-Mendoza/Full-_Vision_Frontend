// Handler modularizado para órdenes
export default async function handleOrders({ method, pathParameters, body, user, supabase, processProductImages, addDiscountToProduct, logger }) {
    switch (method) {
        case 'GET': {
            if (pathParameters?.id) {
                const { data, error } = await supabase.from('orders').select('*, order_items(*)').eq('id', pathParameters.id).single();
                if (error) throw error;
                if (data.user_id !== user.cognitoId && !(user.groups && user.groups.includes('admins'))) {
                    return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden' }) };
                }
                return { statusCode: 200, body: JSON.stringify(data) };
            } else {
                const isAdmin = user.groups && user.groups.includes('admins');
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
                return { statusCode: 200, body: JSON.stringify(data) };
            }
        }
        case 'POST': {
            try {
                let validatedItems = null;
                if (body.items && Array.isArray(body.items)) {
                    validatedItems = await validateAndCalculateOrderItems(body.items);
                }
                const calculatedTotal = calculateOrderTotal(body);
                const orderData = { ...body, user_id: user.cognitoId, email: user.email, total_amount: calculatedTotal };
                const { data: order, error: orderError } = await supabase.from('orders').insert(orderData).select().single();
                if (orderError) throw orderError;
                if (validatedItems && validatedItems.length > 0) {
                    const itemsToInsert = validatedItems.map(item => ({ ...item, order_id: order.id }));
                    const { error: itemsError } = await supabase.from('order_items').insert(itemsToInsert);
                    if (itemsError) throw itemsError;
                }
                return { statusCode: 201, body: JSON.stringify(order) };
            } catch (err) {
                logger.error('Error creating order:', err);
                return { statusCode: 400, body: JSON.stringify({ error: err.message }) };
            }
        }
        case 'PUT': {
            const { data: existingOrder } = await supabase.from('orders').select('user_id').eq('id', pathParameters.id).single();
            if (existingOrder?.user_id !== user.cognitoId && !(user.groups && user.groups.includes('admins'))) {
                return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden' }) };
            }
            const { data, error } = await supabase.from('orders').update(body).eq('id', pathParameters.id).select().single();
            if (error) throw error;
            return { statusCode: 200, body: JSON.stringify(data) };
        }
        default:
            return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }
};

