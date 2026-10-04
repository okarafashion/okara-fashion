import { createClient } from '@supabase/supabase-js';
import { MOCK_PRODUCTS, MOCK_CATEGORIES, MOCK_COLORS } from '../data/mockProducts';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-project.supabase.co'
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * In-memory / local storage state store for offline demo and immediate testing
 */
let localProducts = null;

function getLocalProducts() {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('okara_products_state');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse cached products', e);
      }
    }
  }
  if (!localProducts) {
    localProducts = JSON.parse(JSON.stringify(MOCK_PRODUCTS));
  }
  return localProducts;
}

function saveLocalProducts(products) {
  localProducts = products;
  if (typeof window !== 'undefined') {
    localStorage.setItem('okara_products_state', JSON.stringify(products));
  }
}

/**
 * Fetch all active products
 */
export async function fetchProducts() {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('view_products_full')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data;
      }
    } catch (err) {
      console.warn('Supabase fetch failed, falling back to local dataset:', err);
    }
  }
  return getLocalProducts();
}

/**
 * Fetch a single product by slug
 */
export async function fetchProductBySlug(slug) {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('view_products_full')
        .select('*')
        .eq('slug', slug)
        .single();

      if (!error && data) {
        return data;
      }
    } catch (err) {
      console.warn('Supabase slug fetch failed, falling back to local dataset:', err);
    }
  }
  const all = getLocalProducts();
  return all.find((p) => p.slug === slug) || null;
}

/**
 * Fetch categories
 */
export async function fetchCategories() {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (!error && data && data.length > 0) return data;
    } catch (e) {
      // fallback
    }
  }
  return MOCK_CATEGORIES;
}

/**
 * Fetch colors
 */
export async function fetchColors() {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('colors')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (!error && data && data.length > 0) return data;
    } catch (e) {
      // fallback
    }
  }
  return MOCK_COLORS;
}

/**
 * Admin action: Set Cover Image
 */
export async function setProductCoverImage(productId, colorId, imageId) {
  if (isSupabaseConfigured && supabase) {
    try {
      // Set target to cover (the database trigger handles unsetting the previous cover)
      const { error } = await supabase
        .from('product_images')
        .update({ is_cover: true })
        .eq('id', imageId);

      if (!error) return { success: true };
    } catch (err) {
      console.error('Supabase cover update failed', err);
    }
  }

  // Local state update
  const products = getLocalProducts();
  const product = products.find((p) => p.id === productId);
  if (product && Array.isArray(product.images)) {
    product.images.forEach((img) => {
      const matchesColor = colorId
        ? String(img.color_id) === String(colorId)
        : !img.color_id;
      if (matchesColor) {
        img.is_cover = img.id === imageId;
      }
    });
    saveLocalProducts(products);
  }
  return { success: true };
}

/**
 * Admin action: Reorder Product Images
 */
export async function reorderProductImages(productId, reorderedImages) {
  if (isSupabaseConfigured && supabase) {
    try {
      const updates = reorderedImages.map((img, index) =>
        supabase
          .from('product_images')
          .update({ sort_order: index + 1 })
          .eq('id', img.id)
      );
      await Promise.all(updates);
      return { success: true };
    } catch (err) {
      console.error('Supabase reorder failed', err);
    }
  }

  const products = getLocalProducts();
  const product = products.find((p) => p.id === productId);
  if (product) {
    product.images = reorderedImages.map((img, index) => ({
      ...img,
      sort_order: index + 1,
    }));
    saveLocalProducts(products);
  }
  return { success: true };
}

/**
 * Admin action: Delete Product Image with Cover Auto-Promotion
 */
export async function deleteProductImage(productId, imageId) {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('product_images')
        .delete()
        .eq('id', imageId);

      if (!error) return { success: true };
    } catch (err) {
      console.error('Supabase image delete failed', err);
    }
  }

  const products = getLocalProducts();
  const product = products.find((p) => p.id === productId);
  if (product && Array.isArray(product.images)) {
    const deletedImg = product.images.find((img) => img.id === imageId);
    const filtered = product.images.filter((img) => img.id !== imageId);

    // If deleted image was cover, promote the first remaining in that color/generic group
    if (deletedImg && deletedImg.is_cover) {
      const sameGroup = filtered.filter((img) =>
        deletedImg.color_id
          ? String(img.color_id) === String(deletedImg.color_id)
          : !img.color_id
      );
      if (sameGroup.length > 0) {
        sameGroup[0].is_cover = true;
      }
    }

    product.images = filtered;
    saveLocalProducts(products);
  }
  return { success: true };
}

/**
 * Admin action: Add New Product Image
 */
export async function addProductImage(productId, imageData) {
  const newImage = {
    id: `img-${Date.now()}`,
    product_id: productId,
    color_id: imageData.color_id || null,
    image_url: imageData.image_url,
    alt_text: imageData.alt_text || '',
    sort_order: imageData.sort_order || 99,
    is_cover: Boolean(imageData.is_cover),
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('product_images')
        .insert([
          {
            product_id: productId,
            color_id: imageData.color_id || null,
            image_url: imageData.image_url,
            alt_text: imageData.alt_text,
            sort_order: imageData.sort_order || 10,
            is_cover: imageData.is_cover || false,
          },
        ])
        .select()
        .single();

      if (!error && data) return data;
    } catch (err) {
      console.error('Supabase add image failed', err);
    }
  }

  const products = getLocalProducts();
  const product = products.find((p) => p.id === productId);
  if (product) {
    if (!product.images) product.images = [];
    
    // Check if it's the first image in this group; if so, make it cover automatically
    const sameGroup = product.images.filter((img) =>
      newImage.color_id
        ? String(img.color_id) === String(newImage.color_id)
        : !img.color_id
    );
    if (sameGroup.length === 0) {
      newImage.is_cover = true;
    } else if (newImage.is_cover) {
      sameGroup.forEach((img) => (img.is_cover = false));
    }

    product.images.push(newImage);
    saveLocalProducts(products);
  }
  return newImage;
}
