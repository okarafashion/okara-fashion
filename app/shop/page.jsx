'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '../../components/products/ProductCard';
import { fetchProducts, fetchCategories, fetchColors } from '../../lib/supabaseClient';
import { SlidersHorizontal, ArrowUpDown } from 'lucide-react';

function ShopContent() {

  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'ALL';

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [colors, setColors] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedColor, setSelectedColor] = useState('ALL');
  const [sortBy, setSortBy] = useState('featured');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadShopData() {
      try {
        const [prodList, catList, colList] = await Promise.all([
          fetchProducts(),
          fetchCategories(),
          fetchColors(),
        ]);
        setProducts(prodList || []);
        setCategories(catList || []);
        setColors(colList || []);
      } catch (err) {
        console.error('Failed to load shop data', err);
      } finally {
        setLoading(false);
      }
    }
    loadShopData();
  }, []);

  // Update selectedCategory if query param changes
  useEffect(() => {
    const queryCat = searchParams.get('category');
    if (queryCat) setSelectedCategory(queryCat);
  }, [searchParams]);

  // Filtering Logic
  const filteredProducts = products
    .filter((product) => {
      // Category filter
      if (selectedCategory !== 'ALL') {
        const matchSlug = product.category_slug === selectedCategory;
        const matchId = product.category_id === selectedCategory;
        if (!matchSlug && !matchId) return false;
      }
      // Color filter
      if (selectedColor !== 'ALL') {
        const hasColor = product.colors?.some(
          (c) => c.slug === selectedColor || String(c.id) === String(selectedColor)
        );
        if (!hasColor) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'price-low') {
        const priceA = a.sale_price || a.base_price;
        const priceB = b.sale_price || b.base_price;
        return priceA - priceB;
      }
      if (sortBy === 'price-high') {
        const priceA = a.sale_price || a.base_price;
        const priceB = b.sale_price || b.base_price;
        return priceB - priceA;
      }
      if (sortBy === 'newest') {
        return (b.is_new_arrival ? 1 : 0) - (a.is_new_arrival ? 1 : 0);
      }
      return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      {/* Editorial Page Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="text-xs uppercase tracking-[0.3em] text-[var(--color-muted)] font-light block mb-2">
          OKARA Wardrobe
        </span>
        <h1 className="font-editorial text-4xl sm:text-5xl md:text-6xl font-normal text-[var(--color-text)]">
          The Complete Collection
        </h1>
        <p className="text-xs sm:text-sm text-[var(--color-muted)] font-light mt-3 leading-relaxed">
          Architectural tailoring, flowing silhouettes, and monochromatic craftsmanship engineered for modern luxury.
        </p>
      </div>

      {/* Filter and Controls Toolbar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 mb-10 border-b border-[var(--color-border)]">
        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto scrollbar-none pb-2 md:pb-0">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3.5 py-1.5 text-xs uppercase tracking-[0.18em] subtle-transition border ${
              selectedCategory === 'ALL'
                ? 'bg-[var(--color-primary)] text-[var(--color-secondary)] border-[var(--color-primary)] font-medium'
                : 'bg-[var(--color-surface)] text-[var(--color-muted)] border-[var(--color-border)] hover:text-[var(--color-text)]'
            }`}
          >
            All Pieces
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.slug)}
              className={`px-3.5 py-1.5 text-xs uppercase tracking-[0.18em] subtle-transition border whitespace-nowrap ${
                selectedCategory === cat.slug
                  ? 'bg-[var(--color-primary)] text-[var(--color-secondary)] border-[var(--color-primary)] font-medium'
                  : 'bg-[var(--color-surface)] text-[var(--color-muted)] border-[var(--color-border)] hover:text-[var(--color-text)]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Color Filter & Sorting */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          {/* Color dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[var(--color-muted)] uppercase tracking-wider hidden sm:inline">
              Color:
            </span>
            <select
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className="text-xs bg-[var(--color-surface)] border border-[var(--color-border)] px-2.5 py-1.5 focus:outline-none uppercase tracking-wider text-[var(--color-text)]"
            >
              <option value="ALL">All Palette</option>
              {colors.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[var(--color-muted)] uppercase tracking-wider hidden sm:inline">
              Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs bg-[var(--color-surface)] border border-[var(--color-border)] px-2.5 py-1.5 focus:outline-none uppercase tracking-wider text-[var(--color-text)]"
            >
              <option value="featured">Featured</option>
              <option value="newest">New Arrivals</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Catalog Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="animate-pulse flex flex-col gap-4">
              <div className="bg-neutral-200 aspect-fashion w-full" />
              <div className="h-4 bg-neutral-200 w-3/4" />
              <div className="h-3 bg-neutral-200 w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-24 bg-[var(--color-surface)] border border-[var(--color-border)]">
          <p className="font-editorial text-2xl text-[var(--color-text)]">
            No garments match the selected filters.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('ALL');
              setSelectedColor('ALL');
            }}
            className="mt-4 px-6 py-2.5 bg-[var(--color-primary)] text-[var(--color-secondary)] text-xs uppercase tracking-widest font-medium"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center text-xs uppercase tracking-widest text-[var(--color-muted)]">
        Loading Collection...
      </div>
    }>
      <ShopContent />
    </Suspense>
  );
}

