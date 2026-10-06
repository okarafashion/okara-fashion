'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProductImageManager from '../../../components/admin/ProductImageManager';
import AdminAuthGuard from '../../../components/admin/AdminAuthGuard';
import {
  fetchProducts,
  fetchCategories,
  fetchColors,
  fetchSizes,
  createProduct,
  updateProduct,
  deleteProduct,
  createCategory,
  createColor,
} from '../../../lib/supabaseClient';
import {
  Layers,
  ArrowLeft,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  FolderPlus,
  Palette,
  Sparkles,
  Tag,
  Loader2,
} from 'lucide-react';

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isColorModalOpen, setIsColorModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // null = new, object = edit
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  // Form State for Product
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    subtitle: '',
    description: '',
    fabric_details: '',
    care_instructions: '',
    fit_type: 'Tailored Regular Fit',
    base_price: '',
    sale_price: '',
    category_id: '',
    is_featured: false,
    is_new_arrival: false,
    is_active: true,
    color_ids: [],
    size_ids: [],
  });

  // Form State for Category
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: '',
    description: '',
    image_url: '',
    sort_order: 0,
  });

  // Form State for Color
  const [colorForm, setColorForm] = useState({
    name: '',
    slug: '',
    hex_code: '#000000',
    sort_order: 0,
  });

  const loadAll = async () => {
    try {
      const [prodList, catList, colList, szList] = await Promise.all([
        fetchProducts(true),
        fetchCategories(),
        fetchColors(),
        fetchSizes(),
      ]);
      setProducts(prodList || []);
      setCategories(catList || []);
      setColors(colList || []);
      setSizes(szList || []);

      if (prodList && prodList.length > 0) {
        if (!selectedProductId || !prodList.some((p) => p.id === selectedProductId)) {
          setSelectedProductId(prodList[0].id);
        }
      } else {
        setSelectedProductId(null);
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

  const openNewProductModal = () => {
    setEditingProduct(null);
    setModalError('');
    setFormData({
      name: '',
      slug: '',
      subtitle: '',
      description: '',
      fabric_details: '',
      care_instructions: '',
      fit_type: 'Tailored Regular Fit',
      base_price: '',
      sale_price: '',
      category_id: categories[0]?.id || '',
      is_featured: false,
      is_new_arrival: true,
      is_active: true,
      color_ids: colors.map((c) => c.id),
      size_ids: sizes.map((s) => s.id),
    });
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (product) => {
    setEditingProduct(product);
    setModalError('');
    setFormData({
      name: product.name || '',
      slug: product.slug || '',
      subtitle: product.subtitle || '',
      description: product.description || '',
      fabric_details: product.fabric_details || '',
      care_instructions: product.care_instructions || '',
      fit_type: product.fit_type || 'Tailored Regular Fit',
      base_price: product.base_price || '',
      sale_price: product.sale_price || '',
      category_id: product.category_id || '',
      is_featured: Boolean(product.is_featured),
      is_new_arrival: Boolean(product.is_new_arrival),
      is_active: Boolean(product.is_active),
      color_ids: (product.colors || []).map((c) => c.id),
      size_ids: (product.sizes || []).map((s) => s.id),
    });
    setIsProductModalOpen(true);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError('');

    try {
      if (!formData.name || !formData.base_price) {
        throw new Error('Please fill in product name and base price.');
      }

      if (editingProduct) {
        await updateProduct(editingProduct.id, formData);
      } else {
        const created = await createProduct(formData);
        if (created?.id) setSelectedProductId(created.id);
      }

      setIsProductModalOpen(false);
      await loadAll();
    } catch (err) {
      console.error(err);
      setModalError(err.message || 'Failed to save product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (productId, name) => {
    if (!confirm(`Are you sure you want to permanently delete "${name}"? This will also remove its gallery images.`)) {
      return;
    }
    try {
      await deleteProduct(productId);
      await loadAll();
    } catch (err) {
      alert(err.message || 'Failed to delete product.');
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError('');
    try {
      if (!categoryForm.name) throw new Error('Category name is required.');
      await createCategory(categoryForm);
      setCategoryForm({ name: '', slug: '', description: '', image_url: '', sort_order: 0 });
      setIsCategoryModalOpen(false);
      await loadAll();
    } catch (err) {
      setModalError(err.message || 'Failed to create category.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleColorSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError('');
    try {
      if (!colorForm.name) throw new Error('Color name is required.');
      await createColor(colorForm);
      setColorForm({ name: '', slug: '', hex_code: '#000000', sort_order: 0 });
      setIsColorModalOpen(false);
      await loadAll();
    } catch (err) {
      setModalError(err.message || 'Failed to create color.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleColorSelection = (colorId) => {
    setFormData((prev) => {
      const exists = prev.color_ids.includes(colorId);
      return {
        ...prev,
        color_ids: exists
          ? prev.color_ids.filter((id) => id !== colorId)
          : [...prev.color_ids, colorId],
      };
    });
  };

  const toggleSizeSelection = (sizeId) => {
    setFormData((prev) => {
      const exists = prev.size_ids.includes(sizeId);
      return {
        ...prev,
        size_ids: exists
          ? prev.size_ids.filter((id) => id !== sizeId)
          : [...prev.size_ids, sizeId],
      };
    });
  };

  const currentProduct = products.find((p) => p.id === selectedProductId) || products[0];

  return (
    <AdminAuthGuard>
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
            OKARA Fashion Studio
          </h1>
          <p className="text-xs text-[var(--color-muted)] font-light mt-1">
            Dynamic Supabase catalog with Cloudinary multi-image upload & color variant synchronization.
          </p>
        </div>

        {/* Studio Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={openNewProductModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--color-primary)] text-[var(--color-secondary)] text-xs uppercase tracking-wider font-medium hover:bg-[var(--color-primary-hover)] subtle-transition"
          >
            <Plus size={14} /> Add New Piece
          </button>
          <button
            onClick={() => { setModalError(''); setIsCategoryModalOpen(true); }}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-[var(--color-border)] bg-[var(--color-surface)] text-xs uppercase tracking-wider text-[var(--color-text)] hover:bg-[var(--color-surface-subtle)] subtle-transition"
          >
            <FolderPlus size={13} /> Add Category
          </button>
          <button
            onClick={() => { setModalError(''); setIsColorModalOpen(true); }}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-[var(--color-border)] bg-[var(--color-surface)] text-xs uppercase tracking-wider text-[var(--color-text)] hover:bg-[var(--color-surface-subtle)] subtle-transition"
          >
            <Palette size={13} /> Add Color
          </button>
          <button
            onClick={loadAll}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-[var(--color-border)] bg-[var(--color-surface)] text-xs uppercase tracking-wider text-[var(--color-text)] hover:bg-[var(--color-surface-subtle)] subtle-transition"
            title="Reload Database"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center animate-pulse text-xs text-[var(--color-muted)]">
          Connecting to Supabase studio...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Product Selector List */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            <div className="p-3 bg-[var(--color-surface-subtle)] border border-[var(--color-border)] text-xs uppercase tracking-[0.2em] font-medium text-[var(--color-text)] flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Layers size={14} /> Catalog Pieces ({products.length})
              </span>
              <button
                onClick={openNewProductModal}
                className="text-[10px] text-[var(--color-primary)] font-bold hover:underline flex items-center gap-1"
              >
                <Plus size={11} /> NEW
              </button>
            </div>

            {products.length === 0 ? (
              <div className="p-8 border border-dashed border-[var(--color-border)] text-center text-xs text-[var(--color-muted)] bg-[var(--color-surface)]">
                <p>No products in database.</p>
                <button
                  onClick={openNewProductModal}
                  className="mt-3 px-4 py-2 bg-[var(--color-primary)] text-[var(--color-secondary)] text-xs uppercase tracking-widest font-medium"
                >
                  Create First Piece
                </button>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-[var(--color-border-light)] border border-[var(--color-border)] bg-[var(--color-surface)] max-h-[750px] overflow-y-auto">
                {products.map((p) => {
                  const isSelected = p.id === currentProduct?.id;
                  const cover = p.images?.find((img) => img.is_cover) || p.images?.[0];
                  return (
                    <div
                      key={p.id}
                      className={`group p-3 text-left flex items-center justify-between gap-3 subtle-transition cursor-pointer ${
                        isSelected
                          ? 'bg-[var(--color-primary)] text-[var(--color-secondary)]'
                          : 'hover:bg-[var(--color-surface-subtle)] text-[var(--color-text)]'
                      }`}
                      onClick={() => setSelectedProductId(p.id)}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-12 h-16 bg-neutral-200 overflow-hidden flex-shrink-0 border border-black/10">
                          {cover ? (
                            <img
                              src={cover.image_url}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[8px] bg-neutral-800 text-neutral-400">
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
                          <span
                            className={`text-[9px] uppercase tracking-wider mt-0.5 ${
                              isSelected ? 'text-neutral-400' : 'text-neutral-500'
                            }`}
                          >
                            {p.category_name || 'Uncategorized'}
                          </span>
                        </div>
                      </div>

                      {/* Item Quick Actions */}
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditProductModal(p);
                          }}
                          className={`p-1.5 rounded ${
                            isSelected
                              ? 'text-white hover:bg-white/20'
                              : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
                          }`}
                          title="Edit Details"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProduct(p.id, p.name);
                          }}
                          className={`p-1.5 rounded ${
                            isSelected
                              ? 'text-red-300 hover:bg-red-900/50'
                              : 'text-red-500 hover:bg-red-50'
                          }`}
                          title="Delete Piece"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Active Product Management & Image Manager */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {currentProduct ? (
              <>
                {/* Active Product Summary Banner */}
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] uppercase tracking-[0.2em] px-2 py-0.5 bg-[var(--color-primary)] text-[var(--color-secondary)] font-medium">
                        {currentProduct.category_name || 'Piece'}
                      </span>
                      {currentProduct.is_featured && (
                        <span className="text-[10px] uppercase tracking-[0.2em] px-2 py-0.5 bg-neutral-200 text-black font-medium">
                          Featured
                        </span>
                      )}
                      {currentProduct.is_new_arrival && (
                        <span className="text-[10px] uppercase tracking-[0.2em] px-2 py-0.5 bg-neutral-200 text-black font-medium">
                          New Arrival
                        </span>
                      )}
                    </div>
                    <h2 className="font-editorial text-2xl sm:text-3xl text-[var(--color-text)]">
                      {currentProduct.name}
                    </h2>
                    <p className="text-xs text-[var(--color-muted)] font-light mt-0.5">
                      Slug: /product/{currentProduct.slug} • Price: ₹{currentProduct.sale_price || currentProduct.base_price}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/product/${currentProduct.slug}`}
                      target="_blank"
                      className="px-3 py-2 border border-[var(--color-border)] text-xs uppercase tracking-wider text-[var(--color-text)] hover:bg-[var(--color-surface-subtle)] subtle-transition"
                    >
                      View Live Page
                    </Link>
                    <button
                      onClick={() => openEditProductModal(currentProduct)}
                      className="px-3.5 py-2 bg-[var(--color-primary)] text-[var(--color-secondary)] text-xs uppercase tracking-wider font-medium hover:bg-[var(--color-primary-hover)] subtle-transition flex items-center gap-1.5"
                    >
                      <Edit2 size={12} /> Edit Details
                    </button>
                  </div>
                </div>

                {/* Cloudinary & Supabase Product Image Manager */}
                <ProductImageManager
                  product={currentProduct}
                  onProductUpdated={loadAll}
                />
              </>
            ) : (
              <div className="p-16 text-center border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]">
                <h3 className="font-editorial text-2xl text-[var(--color-text)] mb-2">
                  No Piece Selected
                </h3>
                <p className="text-xs text-[var(--color-muted)] font-light max-w-sm mx-auto mb-6">
                  Select an item from the left catalog list or create a new garment to manage dynamic imagery.
                </p>
                <button
                  onClick={openNewProductModal}
                  className="px-6 py-3 bg-[var(--color-primary)] text-[var(--color-secondary)] text-xs uppercase tracking-widest font-medium inline-flex items-center gap-2"
                >
                  <Plus size={14} /> Add New Piece
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PRODUCT CREATE / EDIT MODAL */}
      {/* ========================================================================= */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6 sm:p-8 max-w-2xl w-full max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border)] mb-6">
              <h3 className="font-editorial text-2xl text-[var(--color-text)]">
                {editingProduct ? 'Edit Garment Details' : 'Create New Garment Piece'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1 text-[var(--color-muted)] hover:text-[var(--color-text)]"
              >
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleProductSubmit} className="flex flex-col gap-4 text-xs">
              {/* Name & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="uppercase tracking-wider text-[var(--color-muted)] font-medium">
                    Garment Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Architectural Cord Set"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="p-2.5 bg-[var(--color-surface-subtle)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none text-[var(--color-text)]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="uppercase tracking-wider text-[var(--color-muted)] font-medium">
                    URL Slug (Optional auto-generated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. architectural-cord-set"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="p-2.5 bg-[var(--color-surface-subtle)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none text-[var(--color-text)]"
                  />
                </div>
              </div>

              {/* Subtitle */}
              <div className="flex flex-col gap-1.5">
                <label className="uppercase tracking-wider text-[var(--color-muted)] font-medium">
                  Editorial Subtitle / Tagline
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tailored co-ord silhouette in structured twill"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  className="p-2.5 bg-[var(--color-surface-subtle)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none text-[var(--color-text)]"
                />
              </div>

              {/* Category, Base Price & Sale Price */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="uppercase tracking-wider text-[var(--color-muted)] font-medium">
                    Category
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="p-2.5 bg-[var(--color-surface-subtle)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none text-[var(--color-text)]"
                  >
                    <option value="">No Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="uppercase tracking-wider text-[var(--color-muted)] font-medium">
                    Base Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="12800"
                    value={formData.base_price}
                    onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                    className="p-2.5 bg-[var(--color-surface-subtle)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none text-[var(--color-text)]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="uppercase tracking-wider text-[var(--color-muted)] font-medium">
                    Sale Price (₹ Optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="10800"
                    value={formData.sale_price}
                    onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                    className="p-2.5 bg-[var(--color-surface-subtle)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none text-[var(--color-text)]"
                  />
                </div>
              </div>

              {/* Color Variants Multi-Select */}
              <div className="flex flex-col gap-1.5">
                <label className="uppercase tracking-wider text-[var(--color-muted)] font-medium">
                  Assign Color Variants (Each color gets synchronized photo gallery)
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {colors.map((c) => {
                    const isSelected = formData.color_ids.includes(c.id);
                    return (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => toggleColorSelection(c.id)}
                        className={`px-3 py-1.5 border rounded-sm flex items-center gap-2 uppercase tracking-wider text-[11px] subtle-transition ${
                          isSelected
                            ? 'bg-[var(--color-primary)] text-[var(--color-secondary)] border-[var(--color-primary)] font-medium'
                            : 'bg-[var(--color-surface-subtle)] text-[var(--color-muted)] border-[var(--color-border)]'
                        }`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-black/20"
                          style={{ backgroundColor: c.hex_code }}
                        />
                        {c.name}
                        {isSelected && <Check size={12} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Size Variants Multi-Select */}
              <div className="flex flex-col gap-1.5">
                <label className="uppercase tracking-wider text-[var(--color-muted)] font-medium">
                  Available Sizes
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {sizes.map((s) => {
                    const isSelected = formData.size_ids.includes(s.id);
                    return (
                      <button
                        type="button"
                        key={s.id}
                        onClick={() => toggleSizeSelection(s.id)}
                        className={`px-3 py-1.5 border rounded-sm uppercase tracking-widest text-[11px] font-medium subtle-transition ${
                          isSelected
                            ? 'bg-[var(--color-primary)] text-[var(--color-secondary)] border-[var(--color-primary)]'
                            : 'bg-[var(--color-surface-subtle)] text-[var(--color-muted)] border-[var(--color-border)]'
                        }`}
                      >
                        {s.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description & Narrative */}
              <div className="flex flex-col gap-1.5">
                <label className="uppercase tracking-wider text-[var(--color-muted)] font-medium">
                  Editorial Narrative / Description
                </label>
                <textarea
                  rows="3"
                  placeholder="Describe the architectural design, inspiration, drape, and styling notes..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="p-2.5 bg-[var(--color-surface-subtle)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none text-[var(--color-text)]"
                />
              </div>

              {/* Fabric & Fit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="uppercase tracking-wider text-[var(--color-muted)] font-medium">
                    Fabric & Composition
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 100% Mulberry Silk / Fine Worsted Wool"
                    value={formData.fabric_details}
                    onChange={(e) => setFormData({ ...formData, fabric_details: e.target.value })}
                    className="p-2.5 bg-[var(--color-surface-subtle)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none text-[var(--color-text)]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="uppercase tracking-wider text-[var(--color-muted)] font-medium">
                    Fit Type
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Tailored Regular Fit / Relaxed Flow"
                    value={formData.fit_type}
                    onChange={(e) => setFormData({ ...formData, fit_type: e.target.value })}
                    className="p-2.5 bg-[var(--color-surface-subtle)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none text-[var(--color-text)]"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-2 border-t border-[var(--color-border-light)]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="w-4 h-4 accent-black"
                  />
                  <span className="uppercase tracking-wider text-[var(--color-text)]">Featured Piece</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_new_arrival}
                    onChange={(e) => setFormData({ ...formData, is_new_arrival: e.target.checked })}
                    className="w-4 h-4 accent-black"
                  />
                  <span className="uppercase tracking-wider text-[var(--color-text)]">New Arrival</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 accent-black"
                  />
                  <span className="uppercase tracking-wider text-[var(--color-text)]">Active / Published</span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-5 py-2.5 border border-[var(--color-border)] text-xs uppercase tracking-wider text-[var(--color-text)] hover:bg-[var(--color-surface-subtle)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-[var(--color-primary)] text-[var(--color-secondary)] text-xs uppercase tracking-widest font-medium hover:bg-[var(--color-primary-hover)] disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={13} className="animate-spin" /> Saving...
                    </>
                  ) : editingProduct ? (
                    'Update Garment Piece'
                  ) : (
                    'Create & Upload Images'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CREATE CATEGORY MODAL */}
      {/* ========================================================================= */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6 sm:p-8 max-w-md w-full">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)] mb-4">
              <h3 className="font-editorial text-2xl text-[var(--color-text)]">
                Create Category
              </h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-[var(--color-muted)] hover:text-[var(--color-text)]"
              >
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCategorySubmit} className="flex flex-col gap-3 text-xs">
              <div className="flex flex-col gap-1">
                <label className="uppercase tracking-wider text-[var(--color-muted)] font-medium">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Monochromatic Outerwear"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="p-2.5 bg-[var(--color-surface-subtle)] border border-[var(--color-border)] focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="uppercase tracking-wider text-[var(--color-muted)] font-medium">
                  Description
                </label>
                <textarea
                  rows="2"
                  placeholder="Architectural silhouettes designed for high luxury..."
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  className="p-2.5 bg-[var(--color-surface-subtle)] border border-[var(--color-border)] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 border border-[var(--color-border)] uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[var(--color-primary)] text-[var(--color-secondary)] uppercase tracking-widest font-medium"
                >
                  {isSubmitting ? 'Saving...' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CREATE COLOR MODAL */}
      {/* ========================================================================= */}
      {isColorModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6 sm:p-8 max-w-md w-full">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)] mb-4">
              <h3 className="font-editorial text-2xl text-[var(--color-text)]">
                Create Color Variant
              </h3>
              <button
                onClick={() => setIsColorModalOpen(false)}
                className="text-[var(--color-muted)] hover:text-[var(--color-text)]"
              >
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleColorSubmit} className="flex flex-col gap-3 text-xs">
              <div className="flex flex-col gap-1">
                <label className="uppercase tracking-wider text-[var(--color-muted)] font-medium">
                  Color Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Noir Black / Pearl White / Slate"
                  value={colorForm.name}
                  onChange={(e) => setColorForm({ ...colorForm, name: e.target.value })}
                  className="p-2.5 bg-[var(--color-surface-subtle)] border border-[var(--color-border)] focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="uppercase tracking-wider text-[var(--color-muted)] font-medium">
                  Color Hex Code
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={colorForm.hex_code}
                    onChange={(e) => setColorForm({ ...colorForm, hex_code: e.target.value })}
                    className="w-10 h-10 border border-[var(--color-border)] cursor-pointer p-0.5 bg-transparent"
                  />
                  <input
                    type="text"
                    value={colorForm.hex_code}
                    onChange={(e) => setColorForm({ ...colorForm, hex_code: e.target.value })}
                    className="p-2.5 bg-[var(--color-surface-subtle)] border border-[var(--color-border)] focus:outline-none font-mono flex-1 uppercase"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setIsColorModalOpen(false)}
                  className="px-4 py-2 border border-[var(--color-border)] uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[var(--color-primary)] text-[var(--color-secondary)] uppercase tracking-widest font-medium"
                >
                  {isSubmitting ? 'Saving...' : 'Create Color'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </AdminAuthGuard>
  );
}
