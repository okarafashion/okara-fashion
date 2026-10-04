# OKARA — Luxury Monochromatic Fashion Platform

**OKARA** is a high-fashion modern Indian clothing brand e-commerce platform built in **JavaScript (Next.js App Router)** with a **centralized configurable theme system**, **Supabase backend**, and a **color-synchronized multi-image gallery system** supporting designated cover photos.

---

## Brand Visual Direction

- **Aesthetic**: Modern Luxury Fashion / Monochromatic Editorial
- **Palette**: Noir Black, Pearl White, Off-white, and subtle Slate tones
- **Typography**: Editorial Serif (`Cormorant Garamond`) paired with architectural Sans (`Plus Jakarta Sans`)
- **Philosophy**: Minimal borders, generous whitespace, focus on product photography, subtle hover micro-interactions.

---

## 1. Centralized Theme System

The design theme is completely centralized in `lib/theme.js` and `app/globals.css`. It uses standard CSS custom properties / design tokens:

```css
--color-primary: #0A0A0A;
--color-primary-hover: #262626;
--color-secondary: #FFFFFF;
--color-background: #FAFAFA;
--color-surface: #FFFFFF;
--color-surface-subtle: #F7F7F8;
--color-text: #0A0A0A;
--color-muted: #737373;
--color-border: #E5E5E5;
--color-accent: #0A0A0A;
--font-editorial: 'Cormorant Garamond', serif;
--font-sans: 'Plus Jakarta Sans', sans-serif;
```

To re-theme or adjust brand colors, simply edit `lib/theme.js` or `app/globals.css` without modifying any components.

---

## 2. Product Image & Cover System

Every product supports:

1. **Designated Cover Image**:
   - Exactly one designated cover image per product / color group.
   - Displayed on Product Cards, Category listings, Search, Featured sections, and Social preview.
2. **Multiple Product Images**:
   - Multiple views: Cover shot, Front studio editorial, Movement & drape, Side silhouette, Fabric & stitching detail.
3. **Color-Specific Image Galleries**:
   - When a customer selects a color swatch, the image gallery, cover image, and thumbnails synchronize dynamically.
   - Fallback to generic product gallery if no color-specific images exist.
4. **Desktop Hover Effect**:
   - On desktop, hovering over a product card reveals the secondary image from the active gallery.
5. **Admin Image Management Studio (`/admin/products`)**:
   - Reorder images (left/right sequence).
   - Set any image as Cover with instant visual badge `[ COVER ]`.
   - Assign images to specific color variants or Generic.
   - Auto-promotes next image if the current cover image is deleted.

---

## 3. Supabase SQL Database Setup

Copy and paste the contents of `supabase.sql` into your **Supabase SQL Editor** and click **RUN**.

It configures:
- Tables: `brand_theme_config`, `categories`, `colors`, `sizes`, `products`, `product_colors`, `product_sizes`, `product_images`.
- **Integrity Triggers**:
  - `trg_enforce_single_cover_image`: Automatically unsets previous cover when a new one is designated.
  - `trg_auto_promote_cover_on_delete`: Automatically promotes the next available image if a cover is deleted.
- **Row Level Security (RLS)**: Public read access, authenticated/admin write policies.
- **Sample Seed Data**: Complete monochromatic editorial collections with color galleries and cover photos.

---

## 4. Environment Variables

Create `.env.local` with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=okara-fashion
```

*Note: The platform is equipped with an integrated mock client fallback. You can run and test the full store and admin studio immediately even without Supabase credentials.*

---

## 5. Development Server

```bash
npm run dev
```

- **Storefront**: `http://localhost:3000`
- **Shop / Catalog**: `http://localhost:3000/shop`
- **Product Detail**: `http://localhost:3000/product/architectural-tailored-cord-set`
- **Admin Image Studio**: `http://localhost:3000/admin/products`
