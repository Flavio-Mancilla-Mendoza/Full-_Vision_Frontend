// Handler modularizado para products by gender
export default async function handleProductsByGender({ method, pathParameters, supabase, processProductImages, addDiscountToProduct, logger }) {
    if (method === 'GET') {
        try {
            const gender = pathParameters?.gender;
            if (!gender) {
                return { statusCode: 400, body: JSON.stringify({ error: 'Gender parameter required' }) };
            }
            logger.info(`Fetching products for gender: ${gender}`);
            const { data, error } = await supabase
                .from('products')
                .select(`
                    *,
                    brand:brands(id, name, slug),
                    product_images(id, url, alt_text, is_primary, s3_key, sort_order)
                `)
                .eq('gender', gender)
                .eq('is_active', true)
                .order('created_at', { ascending: false });
            if (error) throw error;
            const products = await Promise.all((data || []).map(async (product) => {
                const withImages = await processProductImages(product);
                return addDiscountToProduct(withImages);
            }));
            const groupedByStyle = {};
            const availableStyles = new Set();
            const availableMaterials = new Set();
            products.forEach(product => {
                const style = product.frame_style || 'Sin categoría';
                if (!groupedByStyle[style]) groupedByStyle[style] = [];
                groupedByStyle[style].push(product);
                availableStyles.add(style);
                if (product.frame_material) availableMaterials.add(product.frame_material);
            });
            return { statusCode: 200, body: JSON.stringify({ products, groupedByStyle, availableStyles: Array.from(availableStyles), availableMaterials: Array.from(availableMaterials) }) };
        } catch (error) {
            logger.error('Error fetching products by gender:', error);
            throw error;
        }
    }
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
};
