/**
 * Products Handler - Maneja filtros, ordenamiento y paginación de productos
 * Opción 1: Backend completo
 */

const { supabase } = require('../../supabaseClient');

/**
 * Obtener productos con filtros, ordenamiento y paginación
 * @param {Object} params - Parámetros de filtrado
 * @returns {Promise<{products: Array, total: number, page: number, totalPages: number}>}
 */
async function getProductsWithFilters(params) {
  const {
    gender,
    brands = [],
    discount_min = 0,
    price_min = 0,
    price_max = 999999,
    attributes = {}, // { frame_size: ['M', 'L'], frame_material: ['metal'] }
    sort_by = 'featured', // featured, price_asc, price_desc, discount
    page = 1,
    limit = 24,
  } = params;

  console.log('🔍 getProductsWithFilters - Params:', {
    gender,
    brands,
    discount_min,
    price_min,
    price_max,
    sort_by,
    page,
    limit,
  });

  try {
    // Construir query base
    let query = supabase
      .from('products')
      .select(
        `
        *,
        brand:brands!inner (
          id,
          name,
          slug
        )
      `,
        { count: 'exact' }
      )
      .eq('is_active', true);

    // Filtro por género
    if (gender && gender !== 'all') {
      const genderValue = gender.toLowerCase();
      query = query.eq('gender', genderValue);
    }

    // Filtro por marcas
    if (brands.length > 0) {
      query = query.in('brand.name', brands);
    }

    // Filtro por descuento mínimo
    if (discount_min > 0) {
      query = query.gte('discount_percentage', discount_min);
    }

    // Filtro por rango de precio
    // Usamos COALESCE para considerar sale_price o base_price
    if (price_min > 0 || price_max < 999999) {
      query = query.or(
        `and(sale_price.gte.${price_min},sale_price.lte.${price_max}),and(sale_price.is.null,base_price.gte.${price_min},base_price.lte.${price_max})`
      );
    }

    // Filtros dinámicos por atributos (frame_size, frame_material, etc.)
    Object.entries(attributes).forEach(([key, values]) => {
      if (Array.isArray(values) && values.length > 0) {
        query = query.in(key, values);
      }
    });

    // Ordenamiento
    switch (sort_by) {
      case 'price_asc':
        // Ordenar por precio (sale_price o base_price)
        query = query.order('sale_price', { ascending: true, nullsFirst: false });
        break;
      case 'price_desc':
        query = query.order('sale_price', { ascending: false, nullsFirst: false });
        break;
      case 'discount':
        query = query.order('discount_percentage', { ascending: false, nullsFirst: false });
        break;
      case 'featured':
      default:
        // Productos destacados primero, luego por fecha de creación
        query = query
          .order('is_featured', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false });
        break;
    }

    // Paginación
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    // Ejecutar query
    const { data: products, error, count } = await query;

    if (error) {
      console.error('❌ Error en query de productos:', error);
      throw new Error(`Error al obtener productos: ${error.message}`);
    }

    const totalPages = Math.ceil((count || 0) / limit);

    console.log(`✅ Productos obtenidos: ${products?.length || 0} de ${count || 0} total`);

    return {
      products: products || [],
      total: count || 0,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages,
      hasMore: page < totalPages,
    };
  } catch (error) {
    console.error('❌ Error en getProductsWithFilters:', error);
    throw error;
  }
}

/**
 * Obtener filtros dinámicos disponibles para un género
 * (Mantiene la funcionalidad existente pero optimizada)
 */
async function getDynamicFilters(gender) {
  try {
    console.log('🔍 getDynamicFilters para:', gender);

    let query = supabase
      .from('products')
      .select(
        `
        discount_percentage,
        base_price,
        sale_price,
        brand:brands!inner (
          name
        )
      `
      )
      .eq('is_active', true);

    if (gender && gender !== 'all') {
      query = query.eq('gender', gender.toLowerCase());
    }

    const { data: products, error } = await query;

    if (error) {
      console.error('❌ Error obteniendo productos para filtros:', error);
      throw error;
    }

    if (!products || products.length === 0) {
      return {
        discounts: [],
        brands: [],
        priceRange: { min: 0, max: 1000 },
      };
    }

    // Calcular descuentos disponibles
    const discountCounts = {};
    products.forEach((p) => {
      const discount = p.discount_percentage || 0;
      if (discount >= 50) discountCounts['50'] = (discountCounts['50'] || 0) + 1;
      else if (discount >= 30) discountCounts['30'] = (discountCounts['30'] || 0) + 1;
      else if (discount >= 20) discountCounts['20'] = (discountCounts['20'] || 0) + 1;
    });

    const discounts = Object.entries(discountCounts).map(([value, count]) => ({
      value,
      label: `${value}% DCTO`,
      min: parseInt(value),
      max: parseInt(value),
      count,
    }));

    // Calcular marcas disponibles
    const brandCounts = {};
    products.forEach((p) => {
      if (p.brand?.name) {
        brandCounts[p.brand.name] = (brandCounts[p.brand.name] || 0) + 1;
      }
    });

    const brands = Object.entries(brandCounts)
      .map(([name, count]) => ({
        value: name,
        label: name,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    // Calcular rango de precios
    const prices = products.map((p) => p.sale_price || p.base_price).filter((p) => p > 0);

    const priceRange = {
      min: prices.length > 0 ? Math.floor(Math.min(...prices)) : 0,
      max: prices.length > 0 ? Math.ceil(Math.max(...prices)) : 1000,
    };

    console.log('✅ Filtros calculados:', { discounts: discounts.length, brands: brands.length, priceRange });

    return {
      discounts,
      brands,
      priceRange,
    };
  } catch (error) {
    console.error('❌ Error en getDynamicFilters:', error);
    return {
      discounts: [],
      brands: [],
      priceRange: { min: 0, max: 1000 },
    };
  }
}

/**
 * Obtener atributos dinámicos disponibles para un género
 * (frame_size, frame_material, etc.)
 */
async function getDynamicAttributes(gender) {
  try {
    console.log('🔍 getDynamicAttributes para:', gender);

    // Query para obtener valores únicos de atributos
    let query = supabase
      .from('products')
      .select('frame_size, frame_material, lens_type')
      .eq('is_active', true)
      .not('frame_size', 'is', null)
      .not('frame_material', 'is', null);

    if (gender && gender !== 'all') {
      query = query.eq('gender', gender.toLowerCase());
    }

    const { data: products, error } = await query;

    if (error) throw error;

    // Construir atributos únicos
    const attributes = [
      {
        slug: 'frame_size',
        name: 'Talla',
        display_name: 'Talla del Marco',
        values: [...new Set(products.map((p) => p.frame_size).filter(Boolean))].sort(),
      },
      {
        slug: 'frame_material',
        name: 'Material',
        display_name: 'Material del Marco',
        values: [...new Set(products.map((p) => p.frame_material).filter(Boolean))].sort(),
      },
      {
        slug: 'lens_type',
        name: 'Tipo de Lente',
        display_name: 'Tipo de Lente',
        values: [...new Set(products.map((p) => p.lens_type).filter(Boolean))].sort(),
      },
    ].filter((attr) => attr.values.length > 0);

    console.log('✅ Atributos dinámicos obtenidos:', attributes.length);

    return attributes;
  } catch (error) {
    console.error('❌ Error en getDynamicAttributes:', error);
    return [];
  }
}

module.exports = {
  getProductsWithFilters,
  getDynamicFilters,
  getDynamicAttributes,
};
