'use client';

import { useState, useEffect } from 'react';
import CloudinaryImage from '../ui/CloudinaryImage';
import { getProductGallery, getProductCoverImage } from '../../lib/imageHelpers';
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';

export default function ProductGallery({ product, selectedColorId }) {
  // 1. Resolve current active gallery based on selected color
  const activeGallery = getProductGallery(product, selectedColorId);
  const activeCover = getProductCoverImage(product, selectedColorId);

  // 2. Active image state (defaults to color's cover image or first image)
  const [activeImageId, setActiveImageId] = useState(() => activeCover?.id || activeGallery[0]?.id);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  // When selectedColorId changes, automatically sync and switch main image to that color's designated cover image
  useEffect(() => {
    const newCover = getProductCoverImage(product, selectedColorId);
    if (newCover) {
      setActiveImageId(newCover.id);
    } else if (activeGallery.length > 0) {
      setActiveImageId(activeGallery[0].id);
    }
  }, [selectedColorId, product]);

  const currentImage =
    activeGallery.find((img) => img.id === activeImageId) ||
    activeCover ||
    activeGallery[0];

  const currentIndex = activeGallery.findIndex((img) => img.id === currentImage?.id);

  const handleNext = () => {
    const nextIdx = (currentIndex + 1) % activeGallery.length;
    setActiveImageId(activeGallery[nextIdx].id);
  };

  const handlePrev = () => {
    const prevIdx = (currentIndex - 1 + activeGallery.length) % activeGallery.length;
    setActiveImageId(activeGallery[prevIdx].id);
  };

  if (!currentImage) {
    return (
      <div className="w-full aspect-fashion bg-[var(--color-surface-subtle)] flex items-center justify-center text-[var(--color-muted)] font-light">
        No images available
      </div>
    );
  }

  return (
    <div className="flex flex-col-reverse lg:flex-row gap-4 w-full">
      {/* Thumbnail Strip */}
      {activeGallery.length > 1 && (
        <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto lg:max-h-[680px] scrollbar-none py-1">
          {activeGallery.map((img, idx) => {
            const isSelected = img.id === currentImage.id;
            return (
              <button
                key={img.id || idx}
                onClick={() => setActiveImageId(img.id)}
                className={`relative flex-shrink-0 w-16 h-20 sm:w-20 sm:h-24 subtle-transition border overflow-hidden ${
                  isSelected
                    ? 'border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]'
                    : 'border-[var(--color-border)] opacity-70 hover:opacity-100'
                }`}
              >
                <CloudinaryImage
                  src={img.image_url}
                  alt={img.alt_text || `Thumbnail ${idx + 1}`}
                  width={160}
                  className="w-full h-full"
                />
                {img.is_cover && (
                  <span className="absolute top-1 left-1 bg-[var(--color-primary)] text-[var(--color-secondary)] text-[7px] tracking-wider px-1 uppercase font-semibold">
                    Cover
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Main Image Viewport */}
      <div className="relative flex-1 bg-[var(--color-surface-subtle)] aspect-fashion overflow-hidden group">
        <CloudinaryImage
          src={currentImage.image_url}
          alt={currentImage.alt_text || product.name}
          width={1400}
          priority={true}
          className="w-full h-full cursor-zoom-in"
          onClick={() => setIsZoomOpen(true)}
        />

        {/* Cover Image Indicator for Editorial Clarity */}
        {currentImage.is_cover && (
          <div className="absolute top-4 left-4 bg-[var(--color-primary)] text-[var(--color-secondary)] text-[10px] tracking-[0.2em] px-2.5 py-1 uppercase font-medium">
            Cover Shot
          </div>
        )}

        {/* Navigation Arrows for Multiple Images */}
        {activeGallery.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              aria-label="Previous Image"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-[var(--color-surface)]/90 text-[var(--color-text)] flex items-center justify-center opacity-0 group-hover:opacity-100 subtle-transition border border-[var(--color-border)] hover:bg-[var(--color-primary)] hover:text-[var(--color-secondary)]"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={handleNext}
              aria-label="Next Image"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-[var(--color-surface)]/90 text-[var(--color-text)] flex items-center justify-center opacity-0 group-hover:opacity-100 subtle-transition border border-[var(--color-border)] hover:bg-[var(--color-primary)] hover:text-[var(--color-secondary)]"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Zoom trigger icon */}
        <button
          onClick={() => setIsZoomOpen(true)}
          className="absolute bottom-4 right-4 w-9 h-9 bg-[var(--color-surface)]/80 text-[var(--color-text)] flex items-center justify-center border border-[var(--color-border)] opacity-0 group-hover:opacity-100 subtle-transition hover:bg-[var(--color-primary)] hover:text-[var(--color-secondary)]"
          title="Zoom image"
        >
          <Maximize2 size={16} />
        </button>
      </div>

      {/* Lightbox / Zoom Modal */}
      {isZoomOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200"
          onClick={() => setIsZoomOpen(false)}
        >
          <div className="relative max-w-5xl max-h-[90vh] overflow-hidden">
            <img
              src={currentImage.image_url}
              alt={currentImage.alt_text || product.name}
              className="w-full h-full object-contain max-h-[90vh]"
            />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-4 py-2 uppercase tracking-widest border border-neutral-700">
              {currentIndex + 1} / {activeGallery.length} • Click anywhere to close
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
