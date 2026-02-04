// Dynamic Filters Handler migrated from index.js
export default async function handleDynamicFilters({ method, pathParameters, supabase, logger }) {
    if (method === 'GET') {
        try {
            const gender = pathParameters?.gender;
            if (!gender) {
                return { statusCode: 400, body: JSON.stringify({ error: 'Gender parameter required' }) };
            }

            logger.info(`Fetching dynamic filters for gender: ${gender}`);

            const { data: products, error } = await supabase
                .from('products')
                .select(`
                    base_price,
                    sale_price,
                    brand:brands(id, name, slug)
                `)
                .eq('gender', gender)
                .eq('is_active', true);

            if (error) throw error;

            if (!products || products.length === 0) {
                return { statusCode: 200, body: JSON.stringify({ discounts: [], brands: [], priceRange: { min: 0, max: 1000 } }) };
            }

            const productsWithDiscounts = products.map(p => {
                const discount = p.sale_price && p.base_price > 0
                    ? Math.round(((p.base_price - p.sale_price) / p.base_price * 100) * 100) / 100
                    : null;
                return { ...p, discount_percentage: discount };
            });

            const discountMap = new Map();
            productsWithDiscounts.forEach(p => {
                if (p.discount_percentage && p.discount_percentage > 0) {
                    const key = p.discount_percentage;
                    discountMap.set(key, (discountMap.get(key) || 0) + 1);
                }
            });

            const discounts = Array.from(discountMap.entries())
                .sort((a, b) => a[0] - b[0])
                .map(([discount, count]) => ({ value: discount.toString(), label: `${discount}% DCTO`, min: discount, max: discount, count }));

            const brandMap = new Map();
            products.forEach(product => {
                if (product.brand?.name) {
                    const current = brandMap.get(product.brand.name);
                    if (current) {
                        current.count++;
                    } else {
                        brandMap.set(product.brand.name, { name: product.brand.name, count: 1 });
                    }
                }
            });

            const brands = Array.from(brandMap.values()).sort((a, b) => a.name.localeCompare(b.name)).map(b => ({ value: b.name, label: b.name, count: b.count }));

            const prices = products.map(p => p.sale_price || p.base_price);
            const minPrice = Math.floor(Math.min(...prices) / 10) * 10;
            const maxPrice = Math.ceil(Math.max(...prices) / 10) * 10;

            return { statusCode: 200, body: JSON.stringify({ discounts, brands, priceRange: { min: minPrice, max: maxPrice } }) };
        } catch (error) {
            logger.error('Error fetching dynamic filters:', error);
            return { statusCode: 200, body: JSON.stringify({ discounts: [], brands: [], priceRange: { min: 0, max: 1000 } }) };
        }
    }

    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
};
