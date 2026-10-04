'use client';

import { useState } from 'react';
import { getOptimizedImageUrl } from '../../lib/cloudinary';

/**
 * CloudinaryImage - High performance responsive image with lazy loading and skeleton
 */
export default function CloudinaryImage({
  src,
  alt = 'OKARA Fashion Item',
  width = 800,
  height = null,
  className = '',
  aspectRatio = '3/4',
  priority = false,
  crop = 'fill',
  onClick = null,
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const optimizedSrc = getOptimizedImageUrl(src, { width, height, crop });

  return (
    <div
      className={`relative overflow-hidden bg-[#F5F5F7] ${className}`}
      style={{ aspectRatio }}
      onClick={onClick}
    >
      {/* Subtle Shimmer Skeleton while loading */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-neutral-200 animate-pulse" />
      )}

      <img
        src={hasError ? 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80' : optimizedSrc}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`w-full h-full object-cover object-center subtle-transition ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}
