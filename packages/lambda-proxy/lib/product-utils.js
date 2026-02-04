// Utilidades relacionadas con productos y órdenes
export async function processProductImages(product, { generatePresignedUrl, logger } = {}) {
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

export function addDiscountToProduct(product) {
    if (!product) return product;
    const discount = product.sale_price && product.base_price > 0
        ? Math.round(((product.base_price - product.sale_price) / product.base_price * 100) * 100) / 100
        : null;
    return { ...product, discount_percentage: discount };
}

export function calculateOrderTotal(orderData) {
    const subtotal = parseFloat(orderData.subtotal) || 0;
    const tax = parseFloat(orderData.tax_amount) || 0;
    const shipping = parseFloat(orderData.shipping_amount) || 0;
    const discount = parseFloat(orderData.discount_amount) || 0;
    return Math.round((subtotal + tax + shipping - discount) * 100) / 100;
}

export async function validateAndCalculateOrderItems(items, supabase) {
    const calculatedItems = [];

    for (const item of items) {
        const { data: product, error } = await supabase
            .from('products')
            .select('base_price, sale_price, stock_quantity')
            .eq('id', item.product_id)
            .single();

        if (error || !product) {
            throw new Error(`Product ${item.product_id} not found`);
        }

        if (product.stock_quantity < item.quantity) {
            throw new Error(`Insufficient stock for product ${item.product_id}. Available: ${product.stock_quantity}, Requested: ${item.quantity}`);
        }

        const unit_price = product.sale_price || product.base_price;
        const total_price = Math.round(unit_price * item.quantity * 100) / 100;

        calculatedItems.push({ ...item, unit_price, total_price });
    }

    return calculatedItems;
}

export default { processProductImages, addDiscountToProduct, calculateOrderTotal, validateAndCalculateOrderItems };
