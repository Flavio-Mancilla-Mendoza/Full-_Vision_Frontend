// Utilidades relacionadas con productos y órdenes
async function processProductImages(product, { generatePresignedUrl, logger } = {}) {
    if (!product) return product;

    if (product.product_images && Array.isArray(product.product_images)) {
        const imagesWithUrls = await Promise.all(
            product.product_images.map(async (img) => {
                if (img.s3_key) {
                    const presignedUrl = await generatePresignedUrl(img.s3_key);
                    return { ...img, url: presignedUrl || img.url };
                }
                return img;
            })
        );

        product.product_images = imagesWithUrls;
    }

    if ((!product.product_images || product.product_images.length === 0) && product.image_url) {
        product.product_images = [{ id: `legacy-${product.id}`, url: product.image_url, alt_text: product.name || 'Product image', is_primary: true, sort_order: 0 }];
    }

    return product;
}

/**
 * Calcula el precio final de un producto considerando sale_price y discount_percentage.
 * Prioriza sale_price sobre discount_percentage.
 * Esta es la ÚNICA función que debe usarse para calcular precios en todo el backend.
 */
function calculateFinalPrice(product) {
    if (!product) return 0;
    const basePrice = product.base_price || 0;
    if (product.sale_price && product.sale_price > 0) {
        return product.sale_price;
    }
    if (product.discount_percentage && product.discount_percentage > 0) {
        return Math.round(basePrice * (1 - product.discount_percentage / 100) * 100) / 100;
    }
    return basePrice;
}

function addDiscountToProduct(product) {
    if (!product) return product;
    const discount = product.sale_price && product.base_price > 0
        ? Math.round(((product.base_price - product.sale_price) / product.base_price * 100) * 100) / 100
        : null;
    return { ...product, discount_percentage: discount };
}

function calculateOrderTotal(orderData) {
    const subtotal = parseFloat(orderData.subtotal) || 0;
    const tax = parseFloat(orderData.tax_amount) || 0;
    const shipping = parseFloat(orderData.shipping_amount) || 0;
    const discount = parseFloat(orderData.discount_amount) || 0;
    return Math.round((subtotal + tax + shipping - discount) * 100) / 100;
}

async function validateAndCalculateOrderItems(items, supabase) {
    const calculatedItems = [];

    for (const item of items) {
        const { data: product, error } = await supabase
            .from('products')
            .select('base_price, sale_price, discount_percentage, stock_quantity')
            .eq('id', item.product_id)
            .single();

        if (error || !product) {
            throw new Error(`Product ${item.product_id} not found`);
        }

        if (product.stock_quantity < item.quantity) {
            throw new Error(`Insufficient stock for product ${item.product_id}. Available: ${product.stock_quantity}, Requested: ${item.quantity}`);
        }

        const unit_price = calculateFinalPrice(product);
        const total_price = Math.round(unit_price * item.quantity * 100) / 100;

        calculatedItems.push({ ...item, unit_price, total_price });
    }

    return calculatedItems;
}

module.exports = { processProductImages, addDiscountToProduct, calculateFinalPrice, calculateOrderTotal, validateAndCalculateOrderItems };
