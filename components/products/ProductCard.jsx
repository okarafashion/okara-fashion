'use client';

import { useState } from 'react';
import Link from 'next/link';
import CloudinaryImage from '../ui/CloudinaryImage';
import {
  getProductCoverImage,
  getProductSecondaryImage,
  getDefaultColorId,
} from '../../lib/imageHelpers';

export default function ProductCard({ product }) {
  const [selectedColorId, setSelectedColorId] = useState(() => getDefaultColorId(product));
  const [isHovered, setIsHovered] = useState(false);

  if (!product) return null;

  // Resolve cover image and optional secondary hover image
  const coverImage = getProductCoverImage(product, selectedColorId);
  const secondaryImage = getProductSecondaryImage(product, selectedColorId);

  // Price calculations
  const hasDiscount = product.sale_price && product.sale_price < product.base_price;
  const discountPercent = hasDiscount
    ? Math.round(((product.base_price - product.sale_price) / product.base_price) * 100)
    : 0;

  const currentPrice = product.sale_price || product.base_price;

  return (
    <div
      className="group relative flex flex-col"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image Container */}
      <Link
        href={`/product/${product.slug}`}
        className="relative block w-full overflow-hidden bg-[var(--color-surface-subtle)] aspect-fashion cursor-pointer"
      >
        {/* Primary Cover Image */}
        <div
          className={`absolute inset-0 subtle-transition duration-500 ease-out ${
            isHovered && secondaryImage ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
          }`}
        >
          {coverImage ? (
            <CloudinaryImage
              src={coverImage.image_url}
              alt={coverImage.alt_text || product.name}
              width={700}
              className="w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-[var(--color-muted)] uppercase tracking-widest">
              OKARA
            </div>
          )}
        </div>

        {/* Secondary Image (Desktop Hover Effect) */}
        {secondaryImage && (
          <div
            className={`hidden md:block absolute inset-0 subtle-transition duration-500 ease-out ${
              isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
          >
            <CloudinaryImage
              src={secondaryImage.image_url}
              alt={secondaryImage.alt_text || `${product.name} alternate`}
              width={700}
              className="w-full h-full"
            />
          </div>
        )}

        {/* Badges: New Arrival / Featured / Discount */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
          {product.is_new_arrival && (
            <span className="bg-[var(--color-primary)] text-[var(--color-secondary)] text-[10px] tracking-[0.2em] font-medium px-2 py-1 uppercase">
              NEW
            </span>
          )}
          {hasDiscount && (
            <span className="bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] text-[10px] tracking-[0.15em] font-medium px-2 py-1 uppercase">
              {discountPercent}% OFF
            </span>
          )}
        </div>
      </Link>

      {/* Product Information */}
      <div className="pt-4 flex flex-col flex-grow">
        {/* Color Swatches if multiple colors exist */}
        {Array.isArray(product.colors) && product.colors.length > 1 && (
          <div className="flex items-center gap-2 mb-2">
            {product.colors.map((color) => {
              const isSelected = String(color.id) === String(selectedColorId);
              return (
                <button
                  key={color.id}
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedColorId(color.id);
                  }}
                  title={color.name}
                  className={`w-3.5 h-3.5 rounded-full subtle-transition border ${
                    isSelected
                      ? 'border-[var(--color-primary)] ring-1 ring-[var(--color-primary)] ring-offset-1'
                      : 'border-[var(--color-border)] hover:scale-110'
                  }`}
                  style={{ backgroundColor: color.hex_code }}
                />
              );
            })}
            <span className="text-[11px] text-[var(--color-muted)] font-light ml-1">
              {product.colors.length} Colors
            </span>
          </div>
        )}

        {/* Title */}
        <Link href={`/product/${product.slug}`} className="group-hover:text-[var(--color-primary-hover)]">
          <h3 className="font-editorial text-lg md:text-xl font-medium tracking-tight text-[var(--color-text)] leading-snug">
            {product.name}
          </h3>
        </Link>

        {product.subtitle && (
          <p className="text-xs text-[var(--color-muted)] line-clamp-1 mt-0.5 font-light tracking-wide">
            {product.subtitle}
          </p>
        )}

        {/* Pricing */}
        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="text-sm font-medium tracking-wider text-[var(--color-text)]">
            ₹{Number(currentPrice).toLocaleString('en-IN')}
          </span>

          {hasDiscount && (
            <span className="text-xs text-[var(--color-muted)] line-through">
              ₹{Number(product.base_price).toLocaleString('en-IN')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
