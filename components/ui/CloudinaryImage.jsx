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
      {!optimizedSrc || hasError ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-900 text-neutral-400 p-4 text-center select-none">
          <span className="font-editorial text-xl tracking-[0.3em] text-neutral-300">OKARA</span>
          <span className="text-[9px] uppercase tracking-[0.2em] text-neutral-500 mt-1">Editorial Studio</span>
        </div>
      ) : (
        <img
          src={optimizedSrc}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`w-full h-full object-cover object-center subtle-transition ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
}
