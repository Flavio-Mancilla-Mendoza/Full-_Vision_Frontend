// Handler modularizado para liquidación
export default async function handleLiquidacion({ method, supabase, processProductImages, addDiscountToProduct, logger }) {
    if (method === 'GET') {
        try {
            const { data, error } = await supabase
                .from('products')
                .select(`
                    *,
                    category:product_categories(name),
                    brand:brands(name),
                    product_images(id, url, alt_text, is_primary, s3_key, sort_order)
                `)
                .eq('is_active', true)
                .not('sale_price', 'is', null)
                .limit(20);

            if (error && error.code !== 'PGRST116') throw error;

            let products = await Promise.all((data || []).map(async (product) => {
                const withImages = await processProductImages(product);
                return addDiscountToProduct(withImages);
            }));

            if (products.length < 8) {
                const { data: moreProducts } = await supabase
                    .from('products')
                    .select(`
                        *,
                        category:product_categories(name),
                        brand:brands(name),
                        product_images(id, url, alt_text, is_primary, s3_key, sort_order)
                    `)
                    .eq('is_active', true)
                    .limit(8 - products.length);
                if (moreProducts) {
                    const moreProcessed = await Promise.all(moreProducts.map(async (product) => {
                        const withImages = await processProductImages(product);
                        return addDiscountToProduct(withImages);
                    }));
                    products = [...products, ...moreProcessed];
                }
            }

            const uniqueProducts = Array.from(new Map(products.map(p => [p.id, p])).values());

            return { statusCode: 200, body: JSON.stringify(uniqueProducts) };
        } catch (error) {
            logger.error('Error fetching liquidacion:', error);
            return { statusCode: 200, body: JSON.stringify([]) };
        }
    }
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
};
