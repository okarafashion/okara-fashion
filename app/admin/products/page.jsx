'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProductImageManager from '../../../components/admin/ProductImageManager';
import { fetchProducts } from '../../../lib/supabaseClient';
import { Layers, ArrowLeft, RefreshCw, Sparkles, Image as ImageIcon } from 'lucide-react';

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    try {
      const data = await fetchProducts();
      setProducts(data || []);
      if (data && data.length > 0 && !selectedProductId) {
        setSelectedProductId(data[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const currentProduct = products.find((p) => p.id === selectedProductId) || products[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
      {/* Admin Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 mb-8 border-b border-[var(--color-border)]">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[var(--color-muted)] mb-1">
            <Link href="/" className="hover:text-[var(--color-text)] flex items-center gap-1">
              <ArrowLeft size={13} /> Back to Store
            </Link>
            <span>/</span>
            <span>Studio Management</span>
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl text-[var(--color-text)]">
            Product & Image Management
          </h1>
          <p className="text-xs text-[var(--color-muted)] font-light mt-1">
            Configure designated cover shots, color galleries, reordering, and fallback safety rules.
          </p>
        </div>

        <button
          onClick={loadAll}
          className="inline-flex items-center gap-2 px-4 py-2 border border-[var(--color-border)] bg-[var(--color-surface)] text-xs uppercase tracking-wider text-[var(--color-text)] hover:bg-[var(--color-surface-subtle)] subtle-transition"
        >
          <RefreshCw size={13} /> Reload Products
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center animate-pulse text-xs text-[var(--color-muted)]">
          Loading catalog studio...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Product Selector List */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            <div className="p-3 bg-[var(--color-surface-subtle)] border border-[var(--color-border)] text-xs uppercase tracking-[0.2em] font-medium text-[var(--color-text)] flex items-center gap-2">
              <Layers size={14} /> Catalog Pieces ({products.length})
            </div>

            <div className="flex flex-col divide-y divide-[var(--color-border-light)] border border-[var(--color-border)] bg-[var(--color-surface)]">
              {products.map((p) => {
                const isSelected = p.id === currentProduct?.id;
                const cover = p.images?.find((img) => img.is_cover) || p.images?.[0];
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProductId(p.id)}
                    className={`p-3 text-left flex items-center gap-3 subtle-transition ${
                      isSelected
                        ? 'bg-[var(--color-primary)] text-[var(--color-secondary)]'
                        : 'hover:bg-[var(--color-surface-subtle)] text-[var(--color-text)]'
                    }`}
                  >
                    <div className="w-12 h-16 bg-neutral-200 overflow-hidden flex-shrink-0 border border-black/10">
                      {cover ? (
                        <img
                          src={cover.image_url}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[8px]">
                          NO IMG
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="font-editorial text-base truncate font-medium">
                        {p.name}
                      </span>
                      <span
                        className={`text-[11px] truncate ${
                          isSelected ? 'text-neutral-300' : 'text-[var(--color-muted)]'
                        }`}
                      >
                        ₹{p.sale_price || p.base_price} • {p.images?.length || 0} Images
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Active Product Image Management Area */}
          <div className="lg:col-span-8">
            {currentProduct ? (
              <ProductImageManager
                product={currentProduct}
                onProductUpdated={loadAll}
              />
            ) : (
              <div className="p-12 text-center text-xs text-[var(--color-muted)]">
                Select a product to configure images
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
