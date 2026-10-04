/**
 * ==============================================================================
 * OKARA PRODUCT IMAGE & COLOR SYNCHRONIZATION HELPERS
 * ==============================================================================
 * Central business logic for:
 * 1. Resolving color-specific vs generic galleries
 * 2. Determining the designated cover image
 * 3. Secondary image lookup for desktop card hover effects
 * 4. Image reordering and cover auto-reassignment
 */

/**
 * Get the synchronized gallery for a given product and selected color
 * @param {object} product - Product object with images array
 * @param {string|null} selectedColorId - ID of selected color
 * @returns {Array} - Array of image objects
 */
export function getProductGallery(product, selectedColorId = null) {
  if (!product || !Array.isArray(product.images) || product.images.length === 0) {
    return [];
  }

  // 1. If a color is selected, check for images associated with that color
  if (selectedColorId) {
    const colorImages = product.images.filter(
      (img) => String(img.color_id) === String(selectedColorId)
    );

    if (colorImages.length > 0) {
      // Return sorted color gallery (cover first, then by sort_order)
      return [...colorImages].sort((a, b) => {
        if (a.is_cover && !b.is_cover) return -1;
        if (!a.is_cover && b.is_cover) return 1;
        return (a.sort_order || 0) - (b.sort_order || 0);
      });
    }
  }

  // 2. Fallback to generic images (color_id is null) or all available images
  const genericImages = product.images.filter((img) => !img.color_id);
  const gallery = genericImages.length > 0 ? genericImages : product.images;

  return [...gallery].sort((a, b) => {
    if (a.is_cover && !b.is_cover) return -1;
    if (!a.is_cover && b.is_cover) return 1;
    return (a.sort_order || 0) - (b.sort_order || 0);
  });
}

/**
 * Get the designated cover image for a product (with color priority)
 * @param {object} product - Product object
 * @param {string|null} selectedColorId - Selected color ID
 * @returns {object|null} - Cover image object
 */
export function getProductCoverImage(product, selectedColorId = null) {
  if (!product || !Array.isArray(product.images) || product.images.length === 0) {
    return null;
  }

  const gallery = getProductGallery(product, selectedColorId);

  // Find explicit cover in the active gallery
  const cover = gallery.find((img) => img.is_cover);
  if (cover) return cover;

  // Fallback to the first image of the active gallery
  if (gallery.length > 0) return gallery[0];

  // Global fallback to any cover image
  const globalCover = product.images.find((img) => img.is_cover);
  return globalCover || product.images[0];
}

/**
 * Get a secondary image for desktop card hover effects
 * @param {object} product - Product object
 * @param {string|null} selectedColorId - Selected color ID
 * @returns {object|null} - Secondary image object
 */
export function getProductSecondaryImage(product, selectedColorId = null) {
  const gallery = getProductGallery(product, selectedColorId);
  if (gallery.length > 1) {
    return gallery[1];
  }
  return null;
}

/**
 * Resolves the default active color ID for a product
 * @param {object} product - Product object
 * @returns {string|null} - Default color ID
 */
export function getDefaultColorId(product) {
  if (!product || !Array.isArray(product.colors) || product.colors.length === 0) {
    return null;
  }

  // Look for color marked as is_default
  const defaultCol = product.colors.find((c) => c.is_default);
  if (defaultCol) return defaultCol.id;

  // Otherwise return first active color
  return product.colors[0]?.id || null;
}

/**
 * Ensures safety rules: every color group or generic group maintains exactly one cover
 * @param {Array} images - List of images
 * @returns {Array} - Sanitized images with valid cover state
 */
export function sanitizeImageCoverStates(images) {
  if (!Array.isArray(images) || images.length === 0) return [];

  // Group images by color_id (or 'generic')
  const groups = {};
  images.forEach((img) => {
    const key = img.color_id || 'generic';
    if (!groups[key]) groups[key] = [];
    groups[key].push({ ...img });
  });

  const result = [];

  Object.keys(groups).forEach((key) => {
    const group = groups[key];
    const covers = group.filter((img) => img.is_cover);

    if (covers.length === 0) {
      // No cover found: promote the first image
      group[0].is_cover = true;
    } else if (covers.length > 1) {
      // Multiple covers found: retain only the first one
      let foundFirst = false;
      group.forEach((img) => {
        if (img.is_cover) {
          if (!foundFirst) {
            foundFirst = true;
          } else {
            img.is_cover = false;
          }
        }
      });
    }

    result.push(...group);
  });

  return result;
}
