/**
 * ==============================================================================
 * OKARA CLOUDINARY IMAGE DELIVERY & OPTIMIZATION UTILITY
 * ==============================================================================
 * Provides responsive, format-optimized, lazy-load ready URLs with automatic
 * quality negotiation (f_auto, q_auto) and editorial aspect ratio preservation.
 */

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'okara-fashion';

/**
 * Builds an optimized Cloudinary delivery URL
 * @param {string} url - Original image URL or Cloudinary public ID
 * @param {object} options - Options for resizing, cropping, and format
 * @returns {string} - Optimized delivery URL
 */
export function getOptimizedImageUrl(url, options = {}) {
  if (!url) return '/assets/placeholder-product.jpg';

  const {
    width = 800,
    height = null,
    crop = 'fill',
    quality = 'auto:best',
    format = 'auto',
    dpr = 'auto',
  } = options;

  // If it's already a Cloudinary URL
  if (url.includes('res.cloudinary.com')) {
    const parts = url.split('/upload/');
    if (parts.length === 2) {
      let transformation = `f_${format},q_${quality},dpr_${dpr},c_${crop},w_${width}`;
      if (height) transformation += `,h_${height}`;
      return `${parts[0]}/upload/${transformation}/${parts[1]}`;
    }
  }

  // If it's a direct Cloudinary public ID (e.g. 'okara/products/cord-set-black-1')
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
    let transformation = `f_${format},q_${quality},dpr_${dpr},c_${crop},w_${width}`;
    if (height) transformation += `,h_${height}`;
    return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${transformation}/${url}`;
  }

  // If it's an external URL (e.g. Unsplash for high-res editorial mockups)
  if (url.includes('images.unsplash.com')) {
    const baseUrl = url.split('?')[0];
    return `${baseUrl}?auto=format&fit=crop&w=${width}${height ? `&h=${height}` : ''}&q=85`;
  }

  return url;
}

/**
 * Generates responsive srcset string for HTML <img> elements
 */
export function getResponsiveSrcSet(url, widths = [400, 600, 800, 1200, 1600]) {
  if (!url) return '';
  return widths
    .map((w) => `${getOptimizedImageUrl(url, { width: w })} ${w}w`)
    .join(', ');
}
