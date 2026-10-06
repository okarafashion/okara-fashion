import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project.supabase.co')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Normalizes a product record from Supabase
 */
function sanitizeProduct(p) {
  if (!p) return null;
  return {
    ...p,
    images: Array.isArray(p.images) ? p.images.filter(Boolean) : [],
    colors: Array.isArray(p.colors) ? p.colors.filter(Boolean) : [],
    sizes: Array.isArray(p.sizes) ? p.sizes.filter(Boolean) : [],
  };
}

/**
 * Normalizes a direct queried product with joined relations
 */
function normalizeDirectProduct(p) {
  if (!p) return null;
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    subtitle: p.subtitle || '',
    description: p.description || '',
    fabric_details: p.fabric_details || '',
    care_instructions: p.care_instructions || '',
    fit_type: p.fit_type || 'Tailored Regular Fit',
    base_price: p.base_price,
    sale_price: p.sale_price || null,
    is_featured: Boolean(p.is_featured),
    is_new_arrival: Boolean(p.is_new_arrival),
    is_active: Boolean(p.is_active),
    created_at: p.created_at,
    category_id: p.category_id,
    category_name: p.category?.name || '',
    category_slug: p.category?.slug || '',
    images: Array.isArray(p.images)
      ? [...p.images].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      : [],
    colors: Array.isArray(p.colors)
      ? p.colors.map((pc) => ({
          id: pc.color?.id || pc.color_id,
          name: pc.color?.name || '',
          slug: pc.color?.slug || '',
          hex_code: pc.color?.hex_code || '#000000',
          is_default: Boolean(pc.is_default),
        }))
      : [],
    sizes: Array.isArray(p.sizes)
      ? p.sizes.map((ps) => ({
          id: ps.size?.id || ps.size_id,
          name: ps.size?.name || '',
          slug: ps.size?.slug || '',
          stock_quantity: ps.stock_quantity ?? 10,
          sku: ps.sku || '',
        }))
      : [],
  };
}

/**
 * Fetch all active products
 */
export async function fetchProducts(includeInactive = false) {
  if (!supabase) return [];

  try {
    // 1. Try fetching from the helper view
    let query = supabase.from('view_products_full').select('*');
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }
    const { data, error } = await query.order('created_at', { ascending: false });

    if (!error && data) {
      return data.map(sanitizeProduct);
    }

    // 2. Fallback to direct products table query if view does not exist yet
    let directQuery = supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name, slug),
        images:product_images(*),
        colors:product_colors(is_default, color:colors(*)),
        sizes:product_sizes(stock_quantity, sku, size:sizes(*))
      `);
    if (!includeInactive) {
      directQuery = directQuery.eq('is_active', true);
    }
    const { data: directData, error: directErr } = await directQuery.order('created_at', { ascending: false });

    if (!directErr && directData) {
      return directData.map(normalizeDirectProduct);
    }
  } catch (err) {
    console.error('Failed to fetch products from Supabase:', err);
  }

  return [];
}

/**
 * Fetch a single product by slug
 */
export async function fetchProductBySlug(slug) {
  if (!supabase || !slug) return null;

  try {
    // 1. Try view
    const { data, error } = await supabase
      .from('view_products_full')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (!error && data) {
      return sanitizeProduct(data);
    }

    // 2. Direct fallback
    const { data: directData, error: directErr } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name, slug),
        images:product_images(*),
        colors:product_colors(is_default, color:colors(*)),
        sizes:product_sizes(stock_quantity, sku, size:sizes(*))
      `)
      .eq('slug', slug)
      .maybeSingle();

    if (!directErr && directData) {
      return normalizeDirectProduct(directData);
    }
  } catch (err) {
    console.error('Failed to fetch product by slug:', err);
  }

  return null;
}

/**
 * Fetch categories
 */
export async function fetchCategories() {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (!error && data) return data;
  } catch (e) {
    console.error('Failed to fetch categories:', e);
  }
  return [];
}

/**
 * Fetch colors
 */
export async function fetchColors() {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('colors')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (!error && data) return data;
  } catch (e) {
    console.error('Failed to fetch colors:', e);
  }
  return [];
}

/**
 * Fetch sizes
 */
export async function fetchSizes() {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('sizes')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (!error && data) return data;
  } catch (e) {
    console.error('Failed to fetch sizes:', e);
  }
  return [];
}

/**
 * Admin action: Create a new Product
 */
export async function createProduct(productData) {
  if (!supabase) throw new Error('Supabase client is not configured.');

  const {
    name,
    slug,
    subtitle,
    description,
    fabric_details,
    care_instructions,
    fit_type,
    base_price,
    sale_price,
    category_id,
    is_featured,
    is_new_arrival,
    is_active,
    color_ids = [],
    size_ids = [],
  } = productData;

  const generatedSlug = (slug || name)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  // 1. Insert product record
  const { data: newProd, error: prodErr } = await supabase
    .from('products')
    .insert([
      {
        name,
        slug: generatedSlug || `piece-${Date.now()}`,
        subtitle: subtitle || null,
        description: description || null,
        fabric_details: fabric_details || null,
        care_instructions: care_instructions || null,
        fit_type: fit_type || 'Tailored Regular Fit',
        base_price: Number(base_price),
        sale_price: sale_price ? Number(sale_price) : null,
        category_id: category_id || null,
        is_featured: Boolean(is_featured),
        is_new_arrival: Boolean(is_new_arrival),
        is_active: is_active !== undefined ? Boolean(is_active) : true,
      },
    ])
    .select()
    .single();

  if (prodErr || !newProd) {
    throw new Error(prodErr?.message || 'Failed to create product.');
  }

  const productId = newProd.id;

  // 2. Insert Color Mappings
  if (Array.isArray(color_ids) && color_ids.length > 0) {
    const colorInserts = color_ids.map((cid, idx) => ({
      product_id: productId,
      color_id: cid,
      is_default: idx === 0,
      is_active: true,
    }));
    await supabase.from('product_colors').insert(colorInserts);
  }

  // 3. Insert Size Mappings
  if (Array.isArray(size_ids) && size_ids.length > 0) {
    const sizeInserts = size_ids.map((sid) => ({
      product_id: productId,
      size_id: sid,
      stock_quantity: 10,
      is_active: true,
    }));
    await supabase.from('product_sizes').insert(sizeInserts);
  }

  return newProd;
}

/**
 * Admin action: Update existing Product
 */
export async function updateProduct(productId, productData) {
  if (!supabase || !productId) throw new Error('Supabase client or Product ID missing.');

  const {
    name,
    slug,
    subtitle,
    description,
    fabric_details,
    care_instructions,
    fit_type,
    base_price,
    sale_price,
    category_id,
    is_featured,
    is_new_arrival,
    is_active,
    color_ids,
    size_ids,
  } = productData;

  const updatePayload = {};
  if (name !== undefined) updatePayload.name = name;
  if (slug !== undefined) updatePayload.slug = slug;
  if (subtitle !== undefined) updatePayload.subtitle = subtitle;
  if (description !== undefined) updatePayload.description = description;
  if (fabric_details !== undefined) updatePayload.fabric_details = fabric_details;
  if (care_instructions !== undefined) updatePayload.care_instructions = care_instructions;
  if (fit_type !== undefined) updatePayload.fit_type = fit_type;
  if (base_price !== undefined) updatePayload.base_price = Number(base_price);
  if (sale_price !== undefined) updatePayload.sale_price = sale_price ? Number(sale_price) : null;
  if (category_id !== undefined) updatePayload.category_id = category_id || null;
  if (is_featured !== undefined) updatePayload.is_featured = Boolean(is_featured);
  if (is_new_arrival !== undefined) updatePayload.is_new_arrival = Boolean(is_new_arrival);
  if (is_active !== undefined) updatePayload.is_active = Boolean(is_active);

  const { data, error } = await supabase
    .from('products')
    .update(updatePayload)
    .eq('id', productId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Update color mappings if provided
  if (Array.isArray(color_ids)) {
    await supabase.from('product_colors').delete().eq('product_id', productId);
    if (color_ids.length > 0) {
      const colorInserts = color_ids.map((cid, idx) => ({
        product_id: productId,
        color_id: cid,
        is_default: idx === 0,
        is_active: true,
      }));
      await supabase.from('product_colors').insert(colorInserts);
    }
  }

  // Update size mappings if provided
  if (Array.isArray(size_ids)) {
    await supabase.from('product_sizes').delete().eq('product_id', productId);
    if (size_ids.length > 0) {
      const sizeInserts = size_ids.map((sid) => ({
        product_id: productId,
        size_id: sid,
        stock_quantity: 10,
        is_active: true,
      }));
      await supabase.from('product_sizes').insert(sizeInserts);
    }
  }

  return data;
}

/**
 * Admin action: Delete Product
 */
export async function deleteProduct(productId) {
  if (!supabase || !productId) throw new Error('Supabase client or Product ID missing.');

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId);

  if (error) throw new Error(error.message);
  return { success: true };
}

/**
 * Admin action: Set Cover Image
 */
export async function setProductCoverImage(productId, colorId, imageId) {
  if (!supabase) throw new Error('Supabase client is not configured.');

  // 1. Unset existing cover in this color group
  if (colorId) {
    await supabase
      .from('product_images')
      .update({ is_cover: false })
      .eq('product_id', productId)
      .eq('color_id', colorId);
  } else {
    await supabase
      .from('product_images')
      .update({ is_cover: false })
      .eq('product_id', productId)
      .is('color_id', null);
  }

  // 2. Set target image as cover
  const { error } = await supabase
    .from('product_images')
    .update({ is_cover: true })
    .eq('id', imageId);

  if (error) throw new Error(error.message);
  return { success: true };
}

/**
 * Admin action: Reorder Product Images
 */
export async function reorderProductImages(productId, reorderedImages) {
  if (!supabase) throw new Error('Supabase client is not configured.');

  const updates = reorderedImages.map((img, index) =>
    supabase
      .from('product_images')
      .update({ sort_order: index + 1 })
      .eq('id', img.id)
  );
  await Promise.all(updates);
  return { success: true };
}

/**
 * Admin action: Delete Product Image
 */
export async function deleteProductImage(productId, imageId) {
  if (!supabase) throw new Error('Supabase client is not configured.');

  const { error } = await supabase
    .from('product_images')
    .delete()
    .eq('id', imageId);

  if (error) throw new Error(error.message);
  return { success: true };
}

/**
 * Admin action: Add New Product Image
 */
export async function addProductImage(productId, imageData) {
  if (!supabase) throw new Error('Supabase client is not configured.');

  // Check if any cover image exists in this color group
  let hasCover = false;
  try {
    let checkQuery = supabase
      .from('product_images')
      .select('id')
      .eq('product_id', productId)
      .eq('is_cover', true);

    if (imageData.color_id) {
      checkQuery = checkQuery.eq('color_id', imageData.color_id);
    } else {
      checkQuery = checkQuery.is('color_id', null);
    }
    const { data } = await checkQuery;
    hasCover = Boolean(data && data.length > 0);
  } catch (e) {
    // continue
  }

  const shouldBeCover = imageData.is_cover || !hasCover;

  const { data, error } = await supabase
    .from('product_images')
    .insert([
      {
        product_id: productId,
        color_id: imageData.color_id || null,
        image_url: imageData.image_url,
        cloudinary_public_id: imageData.cloudinary_public_id || null,
        alt_text: imageData.alt_text || '',
        sort_order: imageData.sort_order || 10,
        is_cover: shouldBeCover,
      },
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Admin action: Create Category
 */
export async function createCategory(catData) {
  if (!supabase) throw new Error('Supabase client is not configured.');

  const slug = (catData.slug || catData.name)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-');

  const { data, error } = await supabase
    .from('categories')
    .insert([
      {
        name: catData.name,
        slug: slug,
        description: catData.description || '',
        image_url: catData.image_url || '',
        sort_order: Number(catData.sort_order) || 0,
        is_active: true,
      },
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Admin action: Create Color
 */
export async function createColor(colData) {
  if (!supabase) throw new Error('Supabase client is not configured.');

  const slug = (colData.slug || colData.name)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-');

  const { data, error } = await supabase
    .from('colors')
    .insert([
      {
        name: colData.name,
        slug: slug,
        hex_code: colData.hex_code || '#000000',
        sort_order: Number(colData.sort_order) || 0,
        is_active: true,
      },
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
