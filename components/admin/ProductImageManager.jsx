'use client';

import { useState, useRef } from 'react';
import CloudinaryImage from '../ui/CloudinaryImage';
import {
  setProductCoverImage,
  reorderProductImages,
  deleteProductImage,
  addProductImage,
} from '../../lib/supabaseClient';
import {
  Star,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Upload,
  Plus,
  CheckCircle2,
  AlertCircle,
  Tag,
  FileImage,
  Loader2,
} from 'lucide-react';

export default function ProductImageManager({
  product,
  onProductUpdated,
}) {
  const [selectedFilterColor, setSelectedFilterColor] = useState('ALL');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMode, setUploadMode] = useState('file'); // 'file' or 'url'
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploadColorId, setUploadColorId] = useState('');
  const [uploadAltText, setUploadAltText] = useState('');
  const [notification, setNotification] = useState(null);
  const fileInputRef = useRef(null);

  const images = product?.images || [];
  const colors = product?.colors || [];

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Filter images based on color tab
  const filteredImages = images.filter((img) => {
    if (selectedFilterColor === 'ALL') return true;
    if (selectedFilterColor === 'GENERIC') return !img.color_id;
    return String(img.color_id) === String(selectedFilterColor);
  });

  // Handle Set Cover
  const handleSetCover = async (image) => {
    try {
      await setProductCoverImage(product.id, image.color_id, image.id);
      showNotification(`"${image.alt_text || 'Image'}" is now the designated Cover Image.`);
      if (onProductUpdated) onProductUpdated();
    } catch (err) {
      showNotification('Failed to update cover image', 'error');
    }
  };

  // Handle Move / Reorder
  const handleMove = async (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= filteredImages.length) return;

    const newFiltered = [...filteredImages];
    const temp = newFiltered[index];
    newFiltered[index] = newFiltered[targetIdx];
    newFiltered[targetIdx] = temp;

    // Update global sort
    const remainingImages = images.filter(
      (img) => !newFiltered.some((nf) => nf.id === img.id)
    );
    const combined = [...newFiltered, ...remainingImages];

    await reorderProductImages(product.id, combined);
    showNotification('Image sequence reordered.');
    if (onProductUpdated) onProductUpdated();
  };

  // Handle Delete with Cloudinary cleanup & Auto Cover Fallback
  const handleDelete = async (image) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      // 1. Delete from Supabase / local state
      await deleteProductImage(product.id, image.id);

      // 2. Delete from Cloudinary storage in background if it's a Cloudinary asset
      if (image.image_url?.includes('cloudinary.com') || image.cloudinary_public_id) {
        fetch('/api/upload', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileUrl: image.image_url,
            publicId: image.cloudinary_public_id,
          }),
        }).catch((e) => console.warn('Cloudinary delete error:', e));
      }

      showNotification(
        image.is_cover
          ? 'Cover image deleted. Next available image automatically promoted to Cover.'
          : 'Image removed successfully.'
      );
      if (onProductUpdated) onProductUpdated();
    } catch (err) {
      showNotification('Failed to delete image', 'error');
    }
  };

  // Handle File Selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      if (!uploadAltText) {
        setUploadAltText(`${product.name} - ${file.name.replace(/\.[^/.]+$/, '')}`);
      }
    }
  };

  // Handle Upload Submission (File to /api/upload or Direct URL)
  const handleAddImage = async (e) => {
    e.preventDefault();

    let finalImageUrl = uploadUrl.trim();
    let cloudinaryPublicId = null;

    setIsUploading(true);

    try {
      // If uploading a local file from disk via /api/upload
      if (uploadMode === 'file') {
        if (!selectedFile) {
          showNotification('Please select an image file to upload', 'error');
          setIsUploading(false);
          return;
        }

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('folder', 'okara/products');

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();

        if (!res.ok || !data.url) {
          throw new Error(data.error || 'Failed to upload to Cloudinary');
        }

        finalImageUrl = data.url;
        cloudinaryPublicId = data.publicId;
      }

      if (!finalImageUrl) {
        showNotification('Please provide a valid image URL or file', 'error');
        setIsUploading(false);
        return;
      }

      // Save to database / state
      await addProductImage(product.id, {
        image_url: finalImageUrl,
        cloudinary_public_id: cloudinaryPublicId,
        color_id: uploadColorId || null,
        alt_text: uploadAltText.trim() || `${product.name} editorial shot`,
        is_cover: false,
      });

      // Reset form
      setUploadUrl('');
      setSelectedFile(null);
      setPreviewUrl('');
      setUploadAltText('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      showNotification('Product image uploaded & added to gallery successfully.');
      if (onProductUpdated) onProductUpdated();
    } catch (err) {
      console.error(err);
      showNotification(err.message || 'Failed to upload image', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Resolve color name by ID
  const getColorName = (colorId) => {
    if (!colorId) return 'Generic (All Colors)';
    const c = colors.find((col) => String(col.id) === String(colorId));
    return c ? c.name : 'Color Variant';
  };

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--color-border)]">
        <div>
          <h3 className="font-editorial text-2xl text-[var(--color-text)]">
            Product Images & Color Galleries
          </h3>
          <p className="text-xs text-[var(--color-muted)] font-light mt-1">
            Cloudinary upload, cover designation, color-specific galleries, and reordering.
          </p>
        </div>

        {/* Total stats */}
        <div className="flex items-center gap-3 text-xs">
          <span className="px-3 py-1 bg-[var(--color-surface-subtle)] border border-[var(--color-border)] text-[var(--color-text)] font-medium">
            {images.length} Total Images
          </span>
          <span className="px-3 py-1 bg-[var(--color-primary)] text-[var(--color-secondary)] font-medium">
            {images.filter((i) => i.is_cover).length} Active Covers
          </span>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`mt-4 p-3 text-xs flex items-center gap-2 border ${
            notification.type === 'error'
              ? 'bg-red-50 text-red-700 border-red-200'
              : 'bg-neutral-900 text-white border-neutral-800'
          }`}
        >
          {notification.type === 'error' ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Color Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto py-4 border-b border-[var(--color-border)]">
        <span className="text-xs text-[var(--color-muted)] mr-2 flex items-center gap-1">
          <Tag size={12} /> Filter Gallery:
        </span>
        <button
          onClick={() => setSelectedFilterColor('ALL')}
          className={`px-3 py-1.5 text-xs uppercase tracking-wider subtle-transition border ${
            selectedFilterColor === 'ALL'
              ? 'bg-[var(--color-primary)] text-[var(--color-secondary)] border-[var(--color-primary)] font-medium'
              : 'bg-[var(--color-surface)] text-[var(--color-muted)] border-[var(--color-border)] hover:text-[var(--color-text)]'
          }`}
        >
          All Images ({images.length})
        </button>
        <button
          onClick={() => setSelectedFilterColor('GENERIC')}
          className={`px-3 py-1.5 text-xs uppercase tracking-wider subtle-transition border ${
            selectedFilterColor === 'GENERIC'
              ? 'bg-[var(--color-primary)] text-[var(--color-secondary)] border-[var(--color-primary)] font-medium'
              : 'bg-[var(--color-surface)] text-[var(--color-muted)] border-[var(--color-border)] hover:text-[var(--color-text)]'
          }`}
        >
          Generic ({images.filter((i) => !i.color_id).length})
        </button>
        {colors.map((color) => {
          const count = images.filter((i) => String(i.color_id) === String(color.id)).length;
          return (
            <button
              key={color.id}
              onClick={() => setSelectedFilterColor(color.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase tracking-wider subtle-transition border ${
                selectedFilterColor === color.id
                  ? 'bg-[var(--color-primary)] text-[var(--color-secondary)] border-[var(--color-primary)] font-medium'
                  : 'bg-[var(--color-surface)] text-[var(--color-muted)] border-[var(--color-border)] hover:text-[var(--color-text)]'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full border border-black/20"
                style={{ backgroundColor: color.hex_code }}
              />
              {color.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Image Grid */}
      <div className="py-6">
        {filteredImages.length === 0 ? (
          <div className="p-8 border border-dashed border-[var(--color-border)] text-center text-xs text-[var(--color-muted)] font-light">
            No images in this gallery filter. Upload new images below.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredImages.map((image, index) => {
              return (
                <div
                  key={image.id}
                  className={`group relative bg-[var(--color-surface-subtle)] border flex flex-col subtle-transition ${
                    image.is_cover
                      ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20'
                      : 'border-[var(--color-border)] hover:border-neutral-400'
                  }`}
                >
                  {/* Image Viewport */}
                  <div className="relative aspect-fashion w-full overflow-hidden">
                    <CloudinaryImage
                      src={image.image_url}
                      alt={image.alt_text}
                      width={400}
                      className="w-full h-full"
                    />

                    {/* Cover Status Badge */}
                    {image.is_cover ? (
                      <div className="absolute top-2 left-2 bg-[var(--color-primary)] text-[var(--color-secondary)] text-[9px] font-bold tracking-widest px-2 py-0.5 uppercase flex items-center gap-1 shadow-sm">
                        <Star size={10} className="fill-current" /> COVER
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSetCover(image)}
                        className="absolute top-2 left-2 bg-[var(--color-surface)]/90 text-[var(--color-text)] text-[9px] font-medium tracking-wider px-2 py-0.5 uppercase border border-[var(--color-border)] opacity-0 group-hover:opacity-100 subtle-transition hover:bg-[var(--color-primary)] hover:text-white"
                      >
                        Set as Cover
                      </button>
                    )}

                    {/* Quick Delete */}
                    <button
                      onClick={() => handleDelete(image)}
                      className="absolute top-2 right-2 w-7 h-7 bg-white/90 text-red-600 flex items-center justify-center border border-red-200 opacity-0 group-hover:opacity-100 subtle-transition hover:bg-red-600 hover:text-white"
                      title="Delete Image (Storage & Database)"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* Metadata and Controls */}
                  <div className="p-2.5 flex flex-col gap-1.5 text-[11px] bg-[var(--color-surface)] flex-grow">
                    <span className="font-medium text-[var(--color-text)] truncate" title={image.alt_text}>
                      {image.alt_text || 'No Alt Text'}
                    </span>
                    <span className="text-[10px] text-[var(--color-muted)] truncate">
                      {getColorName(image.color_id)}
                    </span>

                    {/* Reorder and Action Toolbar */}
                    <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border-light)] mt-auto">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleMove(index, -1)}
                          disabled={index === 0}
                          className="p-1 text-[var(--color-muted)] hover:text-[var(--color-text)] disabled:opacity-30"
                          title="Move Left"
                        >
                          <ArrowLeft size={13} />
                        </button>
                        <button
                          onClick={() => handleMove(index, 1)}
                          disabled={index === filteredImages.length - 1}
                          className="p-1 text-[var(--color-muted)] hover:text-[var(--color-text)] disabled:opacity-30"
                          title="Move Right"
                        >
                          <ArrowRight size={13} />
                        </button>
                      </div>

                      <span className="text-[10px] font-mono text-[var(--color-muted)]">
                        #{index + 1}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload New Image Section */}
      <div className="mt-6 pt-6 border-t border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-editorial text-lg text-[var(--color-text)] flex items-center gap-2">
            <Upload size={16} /> Add Product Image (Cloudinary Integration)
          </h4>

          {/* Upload Mode Toggle */}
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setUploadMode('file')}
              className={`px-3 py-1 uppercase tracking-wider border subtle-transition ${
                uploadMode === 'file'
                  ? 'bg-[var(--color-primary)] text-[var(--color-secondary)] border-[var(--color-primary)]'
                  : 'bg-[var(--color-surface)] text-[var(--color-muted)] border-[var(--color-border)]'
              }`}
            >
              Upload File
            </button>
            <button
              type="button"
              onClick={() => setUploadMode('url')}
              className={`px-3 py-1 uppercase tracking-wider border subtle-transition ${
                uploadMode === 'url'
                  ? 'bg-[var(--color-primary)] text-[var(--color-secondary)] border-[var(--color-primary)]'
                  : 'bg-[var(--color-surface)] text-[var(--color-muted)] border-[var(--color-border)]'
              }`}
            >
              Image URL
            </button>
          </div>
        </div>

        <form onSubmit={handleAddImage} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* File Upload Mode */}
          {uploadMode === 'file' ? (
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs uppercase tracking-wider text-[var(--color-muted)]">
                Choose Image File (Direct Cloudinary Upload)
              </label>
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="text-xs bg-[var(--color-surface)] border border-[var(--color-border)] p-2 w-full focus:outline-none file:mr-3 file:py-1 file:px-3 file:border-0 file:text-xs file:bg-[var(--color-primary)] file:text-[var(--color-secondary)] file:cursor-pointer"
                />
              </div>
              {previewUrl && (
                <div className="flex items-center gap-2 mt-1 text-[11px] text-[var(--color-muted)]">
                  <FileImage size={13} /> Selected: {selectedFile?.name} ({(selectedFile?.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>
          ) : (
            /* Direct Image URL Mode */
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs uppercase tracking-wider text-[var(--color-muted)]">
                Image / Cloudinary URL
              </label>
              <input
                type="url"
                required
                placeholder="https://images.unsplash.com/... or https://res.cloudinary.com/..."
                value={uploadUrl}
                onChange={(e) => setUploadUrl(e.target.value)}
                className="px-3 py-2 text-xs bg-[var(--color-surface)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>
          )}

          {/* Color Assignment */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase tracking-wider text-[var(--color-muted)]">
              Assign to Color
            </label>
            <select
              value={uploadColorId}
              onChange={(e) => setUploadColorId(e.target.value)}
              className="px-3 py-2 text-xs bg-[var(--color-surface)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none"
            >
              <option value="">Generic (All Colors)</option>
              {colors.map((color) => (
                <option key={color.id} value={color.id}>
                  {color.name}
                </option>
              ))}
            </select>
          </div>

          {/* Alt Text Input */}
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-xs uppercase tracking-wider text-[var(--color-muted)]">
              Alt Text & Image Description
            </label>
            <input
              type="text"
              placeholder="e.g. Architectural Cord Set in Noir Black - Side Silhouette"
              value={uploadAltText}
              onChange={(e) => setUploadAltText(e.target.value)}
              className="px-3 py-2 text-xs bg-[var(--color-surface)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>

          {/* Submit Button */}
          <div className="flex items-end">
            <button
              type="submit"
              disabled={isUploading || (uploadMode === 'file' && !selectedFile) || (uploadMode === 'url' && !uploadUrl)}
              className="w-full py-2.5 bg-[var(--color-primary)] text-[var(--color-secondary)] text-xs uppercase tracking-widest font-medium subtle-transition hover:bg-[var(--color-primary-hover)] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Uploading to Cloudinary...
                </>
              ) : (
                <>
                  <Plus size={14} /> Upload & Add to Gallery
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
