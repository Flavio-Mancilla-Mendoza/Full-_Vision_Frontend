/**
 * Cart Handler - Operaciones del carrito de compras
 * Maneja GET, POST, PUT, DELETE para cart_items
 */

const { getCorsHeaders } = require('../shared/cors');
const { calculateFinalPrice } = require('../lib/product-utils');

/**
 * Handler principal del carrito
 */
module.exports = async function handleCart({ 
    method, 
    pathParameters, 
    body, 
    user, 
    supabase, 
    logger,
    normalizedRequest 
}) {
    const origin = normalizedRequest?.rawEvent?.headers?.origin || normalizedRequest?.rawEvent?.headers?.Origin;
    const headers = getCorsHeaders(origin);

    try {
        // Usuario debe estar autenticado
        if (!user || !user.cognitoId) {
            return {
                statusCode: 401,
                body: JSON.stringify({ error: 'Usuario no autenticado' }),
                headers
            };
        }

        const userId = user.cognitoId;

        switch (method) {
            case 'GET':
                return await handleGetCart(userId, pathParameters, supabase, logger, headers);
            
            case 'POST':
                return await handleAddToCart(userId, body, supabase, logger, headers);
            
            case 'PUT':
                return await handleUpdateCartItem(userId, pathParameters, body, supabase, logger, headers);
            
            case 'DELETE':
                return await handleDeleteCartItem(userId, pathParameters, supabase, logger, headers);
            
            default:
                return {
                    statusCode: 405,
                    body: JSON.stringify({ error: 'Method not allowed' }),
                    headers
                };
        }
    } catch (error) {
        logger.error('Error in cart handler:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message || 'Internal server error' }),
            headers
        };
    }
};

/**
 * GET /cart - Obtener todos los items del carrito
 * GET /cart/summary - Obtener resumen con totales
 * GET /cart/count - Obtener contador de items
 */
async function handleGetCart(userId, pathParameters, supabase, logger, headers) {
    const { action } = pathParameters || {};

    // GET /cart/summary - Resumen con totales
    if (action === 'summary') {
        const items = await getCartItemsWithProducts(userId, supabase, logger);
        const summary = calculateCartSummary(items);
        
        return {
            statusCode: 200,
            body: JSON.stringify(summary),
            headers
        };
    }

    // GET /cart/count - Solo contador
    if (action === 'count') {
        const { data, error } = await supabase
            .from('cart_items')
            .select('quantity')
            .eq('user_id', userId);

        if (error) {
            logger.error('Error getting cart count:', error);
            throw error;
        }

        const count = data?.reduce((sum, item) => sum + item.quantity, 0) || 0;
        
        return {
            statusCode: 200,
            body: JSON.stringify({ count }),
            headers
        };
    }

    // GET /cart - Todos los items con productos
    const items = await getCartItemsWithProducts(userId, supabase, logger);
    
    return {
        statusCode: 200,
        body: JSON.stringify(items),
        headers
    };
}

/**
 * POST /cart - Agregar producto al carrito
 * Body: { product_id, quantity, prescription_details?, special_instructions? }
 */
async function handleAddToCart(userId, body, supabase, logger, headers) {
    const { 
        product_id, 
        quantity = 1, 
        prescription_details, 
        special_instructions 
    } = body;

    // Validación
    if (!product_id) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'product_id es requerido' }),
            headers
        };
    }

    if (quantity <= 0) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'La cantidad debe ser mayor a 0' }),
            headers
        };
    }

    // Verificar disponibilidad del producto
    const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, name, stock_quantity, is_active, base_price, sale_price, discount_percentage')
        .eq('id', product_id)
        .single();

    if (productError || !product) {
        return {
            statusCode: 404,
            body: JSON.stringify({ error: 'Producto no encontrado' }),
            headers
        };
    }

    if (!product.is_active) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Producto no disponible' }),
            headers
        };
    }

    if ((product.stock_quantity || 0) < quantity) {
        return {
            statusCode: 400,
            body: JSON.stringify({ 
                error: `Solo hay ${product.stock_quantity || 0} unidades disponibles` 
            }),
            headers
        };
    }

    // Verificar si el producto ya existe en el carrito
    const { data: existingItems } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', userId)
        .eq('product_id', product_id);

    // Si existe, actualizar cantidad
    if (existingItems && existingItems.length > 0) {
        const existingItem = existingItems[0];
        const newQuantity = existingItem.quantity + quantity;

        // Verificar stock total
        if ((product.stock_quantity || 0) < newQuantity) {
            return {
                statusCode: 400,
                body: JSON.stringify({ 
                    error: `Solo hay ${product.stock_quantity || 0} unidades disponibles (ya tienes ${existingItem.quantity} en el carrito)` 
                }),
                headers
            };
        }

        const { data: updated, error: updateError } = await supabase
            .from('cart_items')
            .update({
                quantity: newQuantity,
                updated_at: new Date().toISOString()
            })
            .eq('id', existingItem.id)
            .select('*')
            .single();

        if (updateError) {
            logger.error('Error updating cart item:', updateError);
            throw updateError;
        }

        // Agregar información del producto
        const result = {
            ...updated,
            product
        };

        return {
            statusCode: 200,
            body: JSON.stringify(result),
            headers
        };
    }

    // Si no existe, crear nuevo item
    const { data: newItem, error: insertError } = await supabase
        .from('cart_items')
        .insert({
            user_id: userId,
            product_id,
            quantity,
            prescription_details,
            special_instructions
        })
        .select('*')
        .single();

    if (insertError) {
        logger.error('Error adding to cart:', insertError);
        throw insertError;
    }

    // Agregar información del producto
    const result = {
        ...newItem,
        product
    };

    return {
        statusCode: 201,
        body: JSON.stringify(result),
        headers
    };
}

/**
 * PUT /cart/:id - Actualizar cantidad de un item
 * Body: { quantity }
 */
async function handleUpdateCartItem(userId, pathParameters, body, supabase, logger, headers) {
    const { id: cartItemId } = pathParameters || {};
    const { quantity } = body;

    if (!cartItemId) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'ID del item es requerido' }),
            headers
        };
    }

    if (!quantity || quantity <= 0) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'La cantidad debe ser mayor a 0' }),
            headers
        };
    }

    // Verificar que el item pertenezca al usuario
    const { data: existingItem, error: fetchError } = await supabase
        .from('cart_items')
        .select('*, products(stock_quantity)')
        .eq('id', cartItemId)
        .eq('user_id', userId)
        .single();

    if (fetchError || !existingItem) {
        return {
            statusCode: 404,
            body: JSON.stringify({ error: 'Item no encontrado en el carrito' }),
            headers
        };
    }

    // Verificar stock disponible
    const stockAvailable = existingItem.products?.stock_quantity || 0;
    if (stockAvailable < quantity) {
        return {
            statusCode: 400,
            body: JSON.stringify({ 
                error: `Solo hay ${stockAvailable} unidades disponibles` 
            }),
            headers
        };
    }

    // Actualizar cantidad
    const { data: updated, error: updateError } = await supabase
        .from('cart_items')
        .update({
            quantity,
            updated_at: new Date().toISOString()
        })
        .eq('id', cartItemId)
        .eq('user_id', userId)
        .select('*')
        .single();

    if (updateError) {
        logger.error('Error updating cart item:', updateError);
        throw updateError;
    }

    // Obtener información del producto
    const { data: product } = await supabase
        .from('products')
        .select('*')
        .eq('id', updated.product_id)
        .single();

    const result = {
        ...updated,
        product
    };

    return {
        statusCode: 200,
        body: JSON.stringify(result),
        headers
    };
}

/**
 * DELETE /cart/:id - Eliminar item del carrito
 * DELETE /cart - Vaciar todo el carrito
 */
async function handleDeleteCartItem(userId, pathParameters, supabase, logger, headers) {
    const { id: cartItemId } = pathParameters || {};

    // DELETE /cart - Vaciar todo el carrito
    if (!cartItemId || cartItemId === 'all') {
        const { error } = await supabase
            .from('cart_items')
            .delete()
            .eq('user_id', userId);

        if (error) {
            logger.error('Error clearing cart:', error);
            throw error;
        }

        return {
            statusCode: 204,
            body: '',
            headers
        };
    }

    // DELETE /cart/:id - Eliminar item específico
    const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId)
        .eq('user_id', userId);

    if (error) {
        logger.error('Error removing cart item:', error);
        throw error;
    }

    return {
        statusCode: 204,
        body: '',
        headers
    };
}

/**
 * Helper: Obtener items del carrito con información de productos
 */
async function getCartItemsWithProducts(userId, supabase, logger) {
    // Obtener cart_items
    const { data: cartItems, error: cartError } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (cartError) {
        logger.error('Error fetching cart items:', cartError);
        throw cartError;
    }

    if (!cartItems || cartItems.length === 0) {
        return [];
    }

    // Obtener productos con imágenes y marca
    const productIds = cartItems.map(item => item.product_id);
    const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*, product_images(*), brand:brands(*)')
        .in('id', productIds);

    if (productsError) {
        logger.warn('Error fetching products:', productsError);
        // Retornar items sin productos si hay error
        return cartItems.map(item => ({
            ...item,
            product: null
        }));
    }

    // Combinar datos
    return cartItems.map(cartItem => ({
        ...cartItem,
        product: products?.find(p => p.id === cartItem.product_id) || null
    }));
}

/**
 * Helper: Calcular resumen del carrito
 */
function calculateCartSummary(items) {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    // Calcular total
    const total = items.reduce((sum, item) => {
        const price = item.product ? calculateFinalPrice(item.product) : 0;
        return sum + (price * item.quantity);
    }, 0);

    // IGV incluido en el precio (18% en Perú)
    const taxRate = 0.18;
    const tax = total * (taxRate / (1 + taxRate));
    const subtotal = total - tax;

    // Envío gratuito para pedidos mayores a S/ 300
    const shipping = total >= 300 ? 0 : 25;
    const finalTotal = total + shipping;

    return {
        items,
        totalItems,
        subtotal: Math.round(subtotal * 100) / 100,
        tax: Math.round(tax * 100) / 100,
        shipping,
        total: Math.round(finalTotal * 100) / 100
    };
}
