'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ProductCard from '../components/products/ProductCard';
import { fetchProducts, fetchCategories } from '../lib/supabaseClient';
import { ArrowRight, Sparkles, ShieldCheck, Truck, RefreshCw } from 'lucide-react';

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [prodList, catList] = await Promise.all([
          fetchProducts(),
          fetchCategories(),
        ]);
        setProducts(prodList || []);
        setCategories(catList || []);
      } catch (err) {
        console.error('Failed to load catalog data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const featuredProducts = products.filter((p) => p.is_featured);
  const newArrivals = products.filter((p) => p.is_new_arrival);

  return (
    <div className="flex flex-col gap-16 md:gap-28 pb-20">
      {/* 1. EDITORIAL HERO CAMPAIGN BANNER */}
      <section className="relative w-full min-h-[85vh] bg-black flex items-center justify-center overflow-hidden">
        {/* Background Editorial Visual */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=2000&q=85"
            alt="OKARA Monochromatic Fashion Campaign"
            className="w-full h-full object-cover object-center brightness-[0.7] contrast-[1.08] grayscale"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        </div>

        {/* Hero Content Overlay */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center flex flex-col items-center gap-6 text-white pt-12">
          {/* Subtle Brand Tag */}
          <div className="inline-flex items-center gap-2 border border-white/30 px-3.5 py-1 text-[10px] tracking-[0.3em] uppercase font-light bg-black/40 backdrop-blur-sm">
            <span>AUTUMN / WINTER 2026</span>
          </div>

          {/* Editorial Headline */}
          <h1 className="font-editorial text-4xl sm:text-6xl md:text-7xl font-normal tracking-tight leading-[1.08] text-white">
            The Monochromatic <br />
            <span className="italic font-light">Discipline</span>
          </h1>

          <p className="text-xs sm:text-sm text-neutral-300 font-light max-w-lg tracking-wide leading-relaxed">
            Wear your story. Architectural tailoring, pure silks, and sculpted cord sets designed in
            the enduring harmony of Noir & Blanc.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mt-2">
            <Link
              href="/shop"
              className="w-full sm:w-auto px-8 py-3.5 bg-white text-black text-xs uppercase tracking-[0.25em] font-medium subtle-transition hover:bg-neutral-200 text-center"
            >
              Explore Collection
            </Link>
            <Link
              href="/shop?category=cord-sets"
              className="w-full sm:w-auto px-8 py-3.5 bg-transparent border border-white/60 text-white text-xs uppercase tracking-[0.25em] font-medium subtle-transition hover:bg-white hover:text-black text-center"
            >
              View Cord Sets
            </Link>
          </div>
        </div>
      </section>

      {/* 2. CATEGORY ARCHITECTURE GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-[var(--color-border)]">
          <div>
            <span className="text-[11px] text-[var(--color-muted)] uppercase tracking-[0.25em] block mb-1">
              Curated Wardrobe
            </span>
            <h2 className="font-editorial text-3xl md:text-4xl text-[var(--color-text)]">
              Signature Silhouettes
            </h2>
          </div>
          <Link
            href="/shop"
            className="text-xs uppercase tracking-[0.18em] text-[var(--color-text)] hover:text-[var(--color-muted)] subtle-transition inline-flex items-center gap-1.5 mt-3 md:mt-0"
          >
            View All Categories <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/shop?category=${cat.slug}`}
              className="group relative flex flex-col overflow-hidden bg-[var(--color-surface-subtle)] border border-[var(--color-border)]"
            >
              <div className="relative aspect-[3/4] w-full overflow-hidden">
                <img
                  src={cat.image_url}
                  alt={cat.name}
                  className="w-full h-full object-cover object-center grayscale contrast-105 group-hover:scale-105 group-hover:grayscale-0 subtle-transition duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                <div className="absolute bottom-5 left-5 right-5 text-white flex flex-col gap-1">
                  <h3 className="font-editorial text-2xl font-medium tracking-tight">
                    {cat.name}
                  </h3>
                  <p className="text-[11px] text-neutral-300 font-light line-clamp-1">
                    {cat.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. FEATURED EDITORIAL COLLECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-[var(--color-border)]">
          <div>
            <span className="text-[11px] text-[var(--color-muted)] uppercase tracking-[0.25em] block mb-1">
              Curated Edits
            </span>
            <h2 className="font-editorial text-3xl md:text-4xl text-[var(--color-text)]">
              Featured Pieces
            </h2>
          </div>
          <p className="text-xs text-[var(--color-muted)] font-light max-w-sm mt-2 md:mt-0">
            Featuring dedicated cover photography and synchronized color variants.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="animate-pulse flex flex-col gap-4">
                <div className="bg-neutral-200 aspect-fashion w-full" />
                <div className="h-4 bg-neutral-200 w-3/4" />
                <div className="h-3 bg-neutral-200 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 4. BRAND MANIFESTO / MONOCHROMATIC ARTISTRY */}
      <section className="bg-[var(--color-surface)] border-y border-[var(--color-border)] py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center gap-6">
          <div className="w-20 h-20 relative mb-2">
            <Image
              src="/okara-logo.png"
              alt="OKARA Brand Seal"
              width={80}
              height={80}
              className="object-contain w-full h-full"
            />
          </div>

          <span className="text-xs uppercase tracking-[0.3em] text-[var(--color-muted)]">
            Philosophy of Form
          </span>

          <blockquote className="font-editorial text-2xl sm:text-3xl md:text-4xl text-[var(--color-text)] font-normal leading-snug tracking-tight italic">
            "In a world cluttered with fleeting noise, OKARA strips away the superfluous. Every seam,
            every lapel, and every fold is an homage to sculptural simplicity."
          </blockquote>

          <div className="w-12 h-[1px] bg-[var(--color-primary)] my-2" />

          <p className="text-xs text-[var(--color-muted)] font-light uppercase tracking-[0.25em]">
            WEAR YOUR STORY • OKARA COUTURE
          </p>
        </div>
      </section>

      {/* 5. NEW ARRIVALS EDITORIAL CAROUSEL / GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-[var(--color-border)]">
          <div>
            <span className="text-[11px] text-[var(--color-muted)] uppercase tracking-[0.25em] block mb-1">
              New Releases
            </span>
            <h2 className="font-editorial text-3xl md:text-4xl text-[var(--color-text)]">
              Latest In Studio
            </h2>
          </div>
          <Link
            href="/shop"
            className="text-xs uppercase tracking-[0.18em] text-[var(--color-text)] hover:text-[var(--color-muted)] subtle-transition inline-flex items-center gap-1.5 mt-3 md:mt-0"
          >
            Shop Full Wardrobe <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
          {newArrivals.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 6. PILLARS OF LUXURY PROMISE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-10 border-t border-[var(--color-border)]">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-[var(--color-surface-subtle)] border border-[var(--color-border)] text-[var(--color-primary)]">
              <Truck size={20} />
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-[0.2em] font-medium text-[var(--color-text)]">
                Pan-India Express Delivery
              </h4>
              <p className="text-xs text-[var(--color-muted)] font-light mt-1 leading-relaxed">
                Hand-packed in bespoke matte archival boxes, delivered straight to your doorstep.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 bg-[var(--color-surface-subtle)] border border-[var(--color-border)] text-[var(--color-primary)]">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-[0.2em] font-medium text-[var(--color-text)]">
                Pure Natural Fibers
              </h4>
              <p className="text-xs text-[var(--color-muted)] font-light mt-1 leading-relaxed">
                Ethically sourced Mulberry silk, virgin wools, and breathable natural blends.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 bg-[var(--color-surface-subtle)] border border-[var(--color-border)] text-[var(--color-primary)]">
              <RefreshCw size={20} />
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-[0.2em] font-medium text-[var(--color-text)]">
                Complimentary Alterations
              </h4>
              <p className="text-xs text-[var(--color-muted)] font-light mt-1 leading-relaxed">
                Every piece is tailored to perfection. Sizing guidance and adjustments available.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
