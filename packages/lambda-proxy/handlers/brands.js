// Handler modularizado para brands
export default async function handleBrands({ method, pathParameters, body, user, supabase, logger }) {
    switch (method) {
        case 'GET': {
            const { data, error } = await supabase
                .from('brands')
                .select('*')
                .eq('is_active', true)
                .order('name');
            if (error) throw error;
            return { statusCode: 200, body: JSON.stringify(data || []) };
        }
        case 'POST': {
            if (!user || !user.groups || !user.groups.includes('admins')) {
                return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden: Admin access required' }) };
            }
            try {
                const { name, slug, description } = body || {};
                if (!name) {
                    return { statusCode: 400, body: JSON.stringify({ error: 'Brand name is required' }) };
                }
                const brandSlug = slug || name.toLowerCase().replace(/\s+/g, '-');
                const { data: existingBrand } = await supabase
                    .from('brands')
                    .select('id')
                    .ilike('name', name)
                    .single();
                if (existingBrand) {
                    return { statusCode: 409, body: JSON.stringify({ error: 'Brand with this name already exists' }) };
                }
                const { data, error } = await supabase
                    .from('brands')
                    .insert({ name, slug: brandSlug, description: description || null, is_active: true })
                    .select()
                    .single();
                if (error) throw error;
                logger.info('Brand created successfully:', data.id);
                return { statusCode: 201, body: JSON.stringify(data) };
            } catch (error) {
                logger.error('Error creating brand:', error);
                throw error;
            }
        }
        default:
            return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }
};
