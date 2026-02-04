// Handler modularizado para bestsellers
export default async function handleBestsellers({ method, supabase, processProductImages, addDiscountToProduct, logger }) {
    if (method === 'GET') {
        try {
            const { data: salesData, error: salesError } = await supabase
                .from('order_items')
                .select(`product_id, quantity`)
                .order('quantity', { ascending: false })
                .limit(100);
            if (salesError && salesError.code !== 'PGRST116') throw salesError;
            const productSales = {};
            (salesData || []).forEach(item => {
                if (!productSales[item.product_id]) productSales[item.product_id] = 0;
                productSales[item.product_id] += item.quantity;
            });
            const topProductIds = Object.entries(productSales)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .map(([id]) => id);
            let products = [];
            if (topProductIds.length > 0) {
                const { data: productsData, error: productsError } = await supabase
                    .from('products')
                    .select(`*, category:product_categories(name), brand:brands(name), product_images(id, url, alt_text, is_primary, s3_key, sort_order)`)
                    .in('id', topProductIds)
                    .eq('is_active', true);
                if (productsError) throw productsError;
                products = await Promise.all(
                    (productsData || []).map(async (product) => {
                        const withImages = await processProductImages(product);
                        const withDiscount = addDiscountToProduct(withImages);
                        return { ...withDiscount, total_sold: productSales[product.id] || 0 };
                    })
                );
                products.sort((a, b) => b.total_sold - a.total_sold);
            }
            if (products.length < 8) {
                const existingIds = new Set(products.map(p => p.id));
                const { data: bestsellerProducts, error: bestsellerError } = await supabase
                    .from('products')
                    .select(`*, category:product_categories(name), brand:brands(name), product_images(id, url, alt_text, is_primary, s3_key, sort_order)`)
                    .eq('is_bestseller', true)
                    .eq('is_active', true)
                    .limit(8);
                if (!bestsellerError && bestsellerProducts) {
                    const uniqueBestsellers = bestsellerProducts.filter(p => !existingIds.has(p.id));
                    const additionalProducts = await Promise.all(
                        uniqueBestsellers.slice(0, 8 - products.length).map(async (product) => {
                            const withImages = await processProductImages(product);
                            return addDiscountToProduct(withImages);
                        })
                    );
                    products = [...products, ...additionalProducts];
                }
            }
            const uniqueProducts = Array.from(
                new Map(products.map(p => [p.id, p])).values()
            );
            return { statusCode: 200, body: JSON.stringify(uniqueProducts) };
        } catch (error) {
            logger.error('Error fetching bestsellers:', error);
            try {
                const { data: fallbackProducts } = await supabase
                    .from('products')
                    .select(`*, category:product_categories(name), brand:brands(name), product_images(id, url, alt_text, is_primary, s3_key, sort_order)`)
                    .eq('is_bestseller', true)
                    .eq('is_active', true)
                    .limit(8);
                const products = await Promise.all(
                    (fallbackProducts || []).map(async (product) => {
                        const withImages = await processProductImages(product);
                        return addDiscountToProduct(withImages);
                    })
                );
                return { statusCode: 200, body: JSON.stringify(products) };
            } catch (fallbackError) {
                return { statusCode: 200, body: JSON.stringify([]) };
            }
        }
    }
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
};
