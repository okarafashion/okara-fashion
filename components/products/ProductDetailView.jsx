'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProductGallery from './ProductGallery';
import ProductCard from './ProductCard';
import { fetchProductBySlug, fetchProducts } from '../../lib/supabaseClient';
import { getDefaultColorId } from '../../lib/imageHelpers';
import {
  Heart,
  Share2,
  Ruler,
  Truck,
  ShieldCheck,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function ProductDetailView({ initialProduct, slug }) {
  const [product, setProduct] = useState(initialProduct);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedColorId, setSelectedColorId] = useState(() => getDefaultColorId(initialProduct));
  const [selectedSizeId, setSelectedSizeId] = useState(() => initialProduct?.sizes?.[0]?.id || null);
  const [loading, setLoading] = useState(!initialProduct);
  const [addedToBag, setAddedToBag] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [openAccordion, setOpenAccordion] = useState('fabric');

  useEffect(() => {
    async function loadData() {
      try {
        const prod = initialProduct || (await fetchProductBySlug(slug));
        setProduct(prod);

        if (prod) {
          const defColorId = getDefaultColorId(prod);
          setSelectedColorId(defColorId);

          if (Array.isArray(prod.sizes) && prod.sizes.length > 0) {
            setSelectedSizeId(prod.sizes[0].id);
          }

          const all = await fetchProducts();
          const related = all.filter((p) => p.id !== prod.id).slice(0, 4);
          setRelatedProducts(related);
        }
      } catch (err) {
        console.error('Failed to load product', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [slug, initialProduct]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="bg-neutral-200 aspect-fashion w-full" />
          <div className="flex flex-col gap-6">
            <div className="h-8 bg-neutral-200 w-3/4" />
            <div className="h-4 bg-neutral-200 w-1/2" />
            <div className="h-12 bg-neutral-200 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <h1 className="font-editorial text-3xl text-[var(--color-text)]">
          Garment Not Found
        </h1>
        <p className="text-xs text-[var(--color-muted)] font-light mt-2">
          The requested fashion piece does not exist or has been archived.
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-block px-8 py-3 bg-[var(--color-primary)] text-[var(--color-secondary)] text-xs uppercase tracking-widest"
        >
          Return to Collection
        </Link>
      </div>
    );
  }

  const hasDiscount = product.sale_price && product.sale_price < product.base_price;
  const currentPrice = product.sale_price || product.base_price;
  const discountPercent = hasDiscount
    ? Math.round(((product.base_price - product.sale_price) / product.base_price) * 100)
    : 0;

  const selectedColorObj = product.colors?.find(
    (c) => String(c.id) === String(selectedColorId)
  );

  const handleAddToBag = () => {
    setAddedToBag(true);
    setTimeout(() => setAddedToBag(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-14">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[11px] text-[var(--color-muted)] uppercase tracking-widest mb-8">
        <Link href="/" className="hover:text-[var(--color-text)]">
          OKARA
        </Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-[var(--color-text)]">
          Collection
        </Link>
        <span>/</span>
        <span className="text-[var(--color-text)]">{product.name}</span>
      </nav>

      {/* Main Product Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-14">
        {/* Left: Synchronized Multi-Image Gallery */}
        <div className="lg:col-span-7">
          <ProductGallery product={product} selectedColorId={selectedColorId} />
        </div>

        {/* Right: Product Narrative, Sizing & Actions */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Title & Header */}
          <div>
            <span className="text-[11px] uppercase tracking-[0.25em] text-[var(--color-muted)] font-light block mb-1">
              {product.category_name || 'OKARA Signature'}
            </span>
            <h1 className="font-editorial text-3xl sm:text-4xl text-[var(--color-text)] font-normal leading-tight">
              {product.name}
            </h1>
            {product.subtitle && (
              <p className="text-xs text-[var(--color-muted)] font-light tracking-wide mt-1.5">
                {product.subtitle}
              </p>
            )}
          </div>

          {/* Pricing */}
          <div className="flex items-baseline gap-3 pb-4 border-b border-[var(--color-border)]">
            <span className="text-xl font-medium tracking-wider text-[var(--color-text)]">
              ₹{Number(currentPrice).toLocaleString('en-IN')}
            </span>
            {hasDiscount && (
              <>
                <span className="text-sm text-[var(--color-muted)] line-through">
                  ₹{Number(product.base_price).toLocaleString('en-IN')}
                </span>
                <span className="text-xs bg-[var(--color-primary)] text-[var(--color-secondary)] px-2 py-0.5 uppercase tracking-wider font-medium">
                  Save {discountPercent}%
                </span>
              </>
            )}
            <span className="text-[10px] text-[var(--color-muted)] font-light ml-auto">
              Inclusive of all taxes
            </span>
          </div>

          {/* COLOR SELECTION (SYNCHRONIZED WITH GALLERY) */}
          {Array.isArray(product.colors) && product.colors.length > 0 && (
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="uppercase tracking-[0.2em] font-medium text-[var(--color-text)]">
                  Color: <span className="font-light text-[var(--color-muted)]">{selectedColorObj?.name || 'Selected'}</span>
                </span>
                <span className="text-[10px] text-[var(--color-muted)] tracking-wider">
                  Swatches sync gallery photos
                </span>
              </div>

              <div className="flex items-center gap-3">
                {product.colors.map((color) => {
                  const isSelected = String(color.id) === String(selectedColorId);
                  return (
                    <button
                      key={color.id}
                      onClick={() => setSelectedColorId(color.id)}
                      className={`group relative flex items-center justify-center w-8 h-8 rounded-full border subtle-transition ${
                        isSelected
                          ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)] ring-offset-2'
                          : 'border-[var(--color-border)] hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.hex_code }}
                      title={color.name}
                    >
                      {isSelected && (
                        <Check
                          size={12}
                          className={color.hex_code === '#F8F8F8' || color.hex_code === '#FFFFFF' ? 'text-black' : 'text-white'}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* SIZE SELECTION */}
          {Array.isArray(product.sizes) && product.sizes.length > 0 && (
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="uppercase tracking-[0.2em] font-medium text-[var(--color-text)]">
                  Select Size
                </span>
                <button
                  onClick={() => setIsSizeGuideOpen(true)}
                  className="inline-flex items-center gap-1 text-[11px] text-[var(--color-muted)] hover:text-[var(--color-text)] underline uppercase tracking-wider"
                >
                  <Ruler size={13} /> Size Guide
                </button>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {product.sizes.map((size) => {
                  const isSelected = String(size.id) === String(selectedSizeId);
                  return (
                    <button
                      key={size.id}
                      onClick={() => setSelectedSizeId(size.id)}
                      className={`py-2.5 text-xs uppercase tracking-widest font-medium border subtle-transition ${
                        isSelected
                          ? 'bg-[var(--color-primary)] text-[var(--color-secondary)] border-[var(--color-primary)]'
                          : 'bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)] hover:border-[var(--color-primary)]'
                      }`}
                    >
                      {size.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ADD TO BAG & PRIMARY ACTIONS */}
          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={handleAddToBag}
              className={`w-full py-4 text-xs uppercase tracking-[0.25em] font-medium subtle-transition flex items-center justify-center gap-2 ${
                addedToBag
                  ? 'bg-neutral-800 text-white'
                  : 'bg-[var(--color-primary)] text-[var(--color-secondary)] hover:bg-[var(--color-primary-hover)]'
              }`}
            >
              {addedToBag ? (
                <>
                  <Check size={16} /> Added to Shopping Bag
                </>
              ) : (
                'Add to Shopping Bag'
              )}
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button className="py-3 px-4 border border-[var(--color-border)] text-xs uppercase tracking-[0.18em] text-[var(--color-text)] hover:bg-[var(--color-surface-subtle)] subtle-transition flex items-center justify-center gap-2 font-medium">
                <Heart size={15} /> Save to Wishlist
              </button>
              <button
                onClick={() => {
                  if (typeof navigator !== 'undefined' && navigator.share) {
                    navigator.share({
                      title: product.name,
                      url: window.location.href,
                    });
                  } else if (typeof navigator !== 'undefined') {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Product link copied to clipboard.');
                  }
                }}
                className="py-3 px-4 border border-[var(--color-border)] text-xs uppercase tracking-[0.18em] text-[var(--color-text)] hover:bg-[var(--color-surface-subtle)] subtle-transition flex items-center justify-center gap-2 font-medium"
              >
                <Share2 size={15} /> Share Piece
              </button>
            </div>
          </div>

          {/* ACCORDIONS */}
          <div className="flex flex-col border-t border-[var(--color-border)] mt-4">
            <div className="py-4 border-b border-[var(--color-border)]">
              <button
                onClick={() => setOpenAccordion(openAccordion === 'narrative' ? '' : 'narrative')}
                className="w-full flex items-center justify-between text-xs uppercase tracking-[0.2em] font-medium text-[var(--color-text)]"
              >
                <span>Editorial Narrative</span>
                {openAccordion === 'narrative' ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>
              {openAccordion === 'narrative' && (
                <p className="text-xs text-[var(--color-muted)] font-light leading-relaxed mt-3">
                  {product.description}
                </p>
              )}
            </div>

            <div className="py-4 border-b border-[var(--color-border)]">
              <button
                onClick={() => setOpenAccordion(openAccordion === 'fabric' ? '' : 'fabric')}
                className="w-full flex items-center justify-between text-xs uppercase tracking-[0.2em] font-medium text-[var(--color-text)]"
              >
                <span>Fabric & Composition</span>
                {openAccordion === 'fabric' ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>
              {openAccordion === 'fabric' && (
                <div className="text-xs text-[var(--color-muted)] font-light leading-relaxed mt-3 flex flex-col gap-1.5">
                  <p>{product.fabric_details || '100% Premium Natural Fibers.'}</p>
                  <p className="text-[11px] text-neutral-400">Fit Silhouette: {product.fit_type}</p>
                </div>
              )}
            </div>

            <div className="py-4 border-b border-[var(--color-border)]">
              <button
                onClick={() => setOpenAccordion(openAccordion === 'care' ? '' : 'care')}
                className="w-full flex items-center justify-between text-xs uppercase tracking-[0.2em] font-medium text-[var(--color-text)]"
              >
                <span>Garment Care & Maintenance</span>
                {openAccordion === 'care' ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>
              {openAccordion === 'care' && (
                <p className="text-xs text-[var(--color-muted)] font-light leading-relaxed mt-3">
                  {product.care_instructions || 'Specialist dry clean only. Store in breathable garment cover.'}
                </p>
              )}
            </div>

            <div className="py-4 border-b border-[var(--color-border)]">
              <button
                onClick={() => setOpenAccordion(openAccordion === 'shipping' ? '' : 'shipping')}
                className="w-full flex items-center justify-between text-xs uppercase tracking-[0.2em] font-medium text-[var(--color-text)]"
              >
                <span>Complimentary Delivery & Alterations</span>
                {openAccordion === 'shipping' ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>
              {openAccordion === 'shipping' && (
                <div className="text-xs text-[var(--color-muted)] font-light leading-relaxed mt-3 flex flex-col gap-2">
                  <p>• Complimentary express shipping across all pin codes in India.</p>
                  <p>• Hand-delivered in custom OKARA archival presentation boxes.</p>
                  <p>• Complimentary sizing adjustments available within 14 days of receipt.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SIZING GUIDE MODAL */}
      {isSizeGuideOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsSizeGuideOpen(false)}
        >
          <div
            className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6 md:p-8 max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border)]">
              <h3 className="font-editorial text-2xl text-[var(--color-text)]">
                OKARA Sizing Matrix (Inches)
              </h3>
              <button
                onClick={() => setIsSizeGuideOpen(false)}
                className="text-xs uppercase tracking-widest text-[var(--color-muted)] hover:text-[var(--color-text)]"
              >
                Close
              </button>
            </div>

            <table className="w-full text-xs mt-4 text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-[var(--color-muted)] uppercase tracking-wider">
                  <th className="py-2">Size</th>
                  <th className="py-2">Bust</th>
                  <th className="py-2">Waist</th>
                  <th className="py-2">Hips</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-light)] text-[var(--color-text)]">
                <tr><td className="py-2.5 font-medium">XS</td><td>32 - 33"</td><td>24 - 25"</td><td>34 - 35"</td></tr>
                <tr><td className="py-2.5 font-medium">S</td><td>34 - 35"</td><td>26 - 27"</td><td>36 - 37"</td></tr>
                <tr><td className="py-2.5 font-medium">M</td><td>36 - 37"</td><td>28 - 29"</td><td>38 - 39"</td></tr>
                <tr><td className="py-2.5 font-medium">L</td><td>38 - 40"</td><td>30 - 32"</td><td>40 - 42"</td></tr>
                <tr><td className="py-2.5 font-medium">XL</td><td>41 - 43"</td><td>33 - 35"</td><td>43 - 45"</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RELATED PIECES */}
      {relatedProducts.length > 0 && (
        <section className="mt-24 pt-12 border-t border-[var(--color-border)]">
          <div className="flex items-center justify-between mb-8 pb-3 border-b border-[var(--color-border)]">
            <h3 className="font-editorial text-3xl text-[var(--color-text)]">
              Complete the Aesthetic
            </h3>
            <Link
              href="/shop"
              className="text-xs uppercase tracking-[0.18em] text-[var(--color-text)] hover:text-[var(--color-muted)]"
            >
              View All
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
