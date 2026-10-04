-- ==============================================================================
-- OKARA FASHION - SUPABASE DATABASE SCHEMA & SEED DATA
-- Copy and paste this directly into the Supabase SQL Editor and click "RUN".
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop existing tables if re-running script (in reverse dependency order)
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS product_images CASCADE;
DROP TABLE IF EXISTS product_sizes CASCADE;
DROP TABLE IF EXISTS product_colors CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS sizes CASCADE;
DROP TABLE IF EXISTS colors CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS brand_theme_config CASCADE;

-- ==============================================================================
-- 3. CORE TABLES
-- ==============================================================================

-- Brand Theme Centralized Configuration
CREATE TABLE brand_theme_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    theme_name TEXT NOT NULL DEFAULT 'OKARA Noir & Blanc',
    is_active BOOLEAN NOT NULL DEFAULT true,
    tokens JSONB NOT NULL DEFAULT '{
        "colorPrimary": "#0A0A0A",
        "colorSecondary": "#FFFFFF",
        "colorBackground": "#FAFAFA",
        "colorSurface": "#FFFFFF",
        "colorSurfaceSubtle": "#F5F5F7",
        "colorText": "#111111",
        "colorMuted": "#737373",
        "colorBorder": "#E5E5E5",
        "colorAccent": "#0A0A0A",
        "fontEditorial": "Cormorant Garamond, serif",
        "fontSans": "Plus Jakarta Sans, sans-serif"
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Categories Table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Colors Table
CREATE TABLE colors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    hex_code TEXT NOT NULL DEFAULT '#000000',
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Sizes Table
CREATE TABLE sizes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Products Table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    subtitle TEXT,
    description TEXT,
    fabric_details TEXT,
    care_instructions TEXT,
    fit_type TEXT DEFAULT 'Tailored Regular Fit',
    base_price NUMERIC(10, 2) NOT NULL,
    sale_price NUMERIC(10, 2),
    is_featured BOOLEAN DEFAULT false,
    is_new_arrival BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Product Colors Mapping
CREATE TABLE product_colors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    color_id UUID NOT NULL REFERENCES colors(id) ON DELETE CASCADE,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(product_id, color_id)
);

-- Product Sizes & Inventory Mapping
CREATE TABLE product_sizes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    size_id UUID NOT NULL REFERENCES sizes(id) ON DELETE CASCADE,
    stock_quantity INT DEFAULT 10,
    sku TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(product_id, size_id)
);

-- ==============================================================================
-- 4. PRODUCT IMAGES TABLE (Multi-image, Color-specific, Cover Image Support)
-- ==============================================================================
CREATE TABLE product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    color_id UUID REFERENCES colors(id) ON DELETE SET NULL,
    cloudinary_public_id TEXT,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    sort_order INT DEFAULT 0,
    is_cover BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for lightning fast gallery queries
CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_product_images_color_id ON product_images(color_id);
CREATE INDEX idx_product_images_cover ON product_images(product_id, color_id, is_cover);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_featured ON products(is_featured);

-- ==============================================================================
-- 5. AUTOMATIC COVER IMAGE INTEGRITY & PROMOTION TRIGGERS
-- ==============================================================================

-- Trigger Function: Enforce Single Cover Image per Product & Color Group
CREATE OR REPLACE FUNCTION handle_product_image_cover_insert_update()
RETURNS TRIGGER AS $$
BEGIN
    -- If the new/updated row is marked as cover
    IF NEW.is_cover = true THEN
        -- Unset is_cover for other images of the same product and color (or null color)
        IF NEW.color_id IS NOT NULL THEN
            UPDATE product_images
            SET is_cover = false
            WHERE product_id = NEW.product_id
              AND color_id = NEW.color_id
              AND id <> NEW.id;
        ELSE
            UPDATE product_images
            SET is_cover = false
            WHERE product_id = NEW.product_id
              AND color_id IS NULL
              AND id <> NEW.id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_enforce_single_cover_image
BEFORE INSERT OR UPDATE OF is_cover ON product_images
FOR EACH ROW
EXECUTE FUNCTION handle_product_image_cover_insert_update();

-- Trigger Function: Auto-promote Next Image to Cover upon Cover Deletion
CREATE OR REPLACE FUNCTION handle_product_image_delete_cover()
RETURNS TRIGGER AS $$
DECLARE
    next_image_id UUID;
BEGIN
    -- If deleted image was the cover image
    IF OLD.is_cover = true THEN
        IF OLD.color_id IS NOT NULL THEN
            -- Find next lowest sort_order image for that color
            SELECT id INTO next_image_id
            FROM product_images
            WHERE product_id = OLD.product_id
              AND color_id = OLD.color_id
            ORDER BY sort_order ASC, created_at ASC
            LIMIT 1;
        ELSE
            -- Find next lowest sort_order generic image
            SELECT id INTO next_image_id
            FROM product_images
            WHERE product_id = OLD.product_id
              AND color_id IS NULL
            ORDER BY sort_order ASC, created_at ASC
            LIMIT 1;
        END IF;

        -- Promote next image if one exists
        IF next_image_id IS NOT NULL THEN
            UPDATE product_images
            SET is_cover = true
            WHERE id = next_image_id;
        END IF;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_promote_cover_on_delete
AFTER DELETE ON product_images
FOR EACH ROW
EXECUTE FUNCTION handle_product_image_delete_cover();

-- ==============================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE brand_theme_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- Allow public read access to all catalog & theme data
CREATE POLICY "Public can view theme" ON brand_theme_config FOR SELECT USING (true);
CREATE POLICY "Public can view categories" ON categories FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view colors" ON colors FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view sizes" ON sizes FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view active products" ON products FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view product colors" ON product_colors FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view product sizes" ON product_sizes FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view product images" ON product_images FOR SELECT USING (true);

-- Allow authenticated / admin full access (or demo open access for development)
CREATE POLICY "Admin full access theme" ON brand_theme_config FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access colors" ON colors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access sizes" ON sizes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access product colors" ON product_colors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access product sizes" ON product_sizes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access product images" ON product_images FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- 7. SEED DATA (OKARA High-Fashion Monochromatic Collection)
-- ==============================================================================

-- Brand Theme Default
INSERT INTO brand_theme_config (theme_name, is_active, tokens) VALUES
(
    'OKARA Signature Noir & Blanc',
    true,
    '{
        "colorPrimary": "#0A0A0A",
        "colorSecondary": "#FFFFFF",
        "colorBackground": "#FAFAFA",
        "colorSurface": "#FFFFFF",
        "colorSurfaceSubtle": "#F5F5F7",
        "colorText": "#111111",
        "colorMuted": "#737373",
        "colorBorder": "#E5E5E5",
        "colorAccent": "#0A0A0A",
        "fontEditorial": "Cormorant Garamond, serif",
        "fontSans": "Plus Jakarta Sans, sans-serif"
    }'::jsonb
);

-- Categories
INSERT INTO categories (id, name, slug, description, image_url, sort_order) VALUES
('c1000000-0000-0000-0000-000000000001', 'Cord Sets', 'cord-sets', 'Refined co-ord ensembles tailored with architectural precision and fluid movement.', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80', 1),
('c1000000-0000-0000-0000-000000000002', 'Tailored Blazers', 'blazers', 'Sculptural silhouettes and structured outerwear crafted from premium wool-blend suiting.', 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=1200&q=80', 2),
('c1000000-0000-0000-0000-000000000003', 'Editorial Dresses', 'dresses', 'Monochromatic floor-length gowns and ribbed knit silhouettes with understated sensuality.', 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1200&q=80', 3),
('c1000000-0000-0000-0000-000000000004', 'Silk Tops & Shirts', 'tops-shirts', 'Lustrous mulberry silk shirts and asymmetric draped tops for elevated everyday styling.', 'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=1200&q=80', 4);

-- Colors
INSERT INTO colors (id, name, slug, hex_code, sort_order) VALUES
('b1000000-0000-0000-0000-000000000001', 'Noir Black', 'noir-black', '#0A0A0A', 1),
('b1000000-0000-0000-0000-000000000002', 'Pearl White', 'pearl-white', '#F8F8F8', 2),
('b1000000-0000-0000-0000-000000000003', 'Champagne Nude', 'champagne-nude', '#EAD9CE', 3),
('b1000000-0000-0000-0000-000000000004', 'Charcoal Slate', 'charcoal-slate', '#2D2D2D', 4);

-- Sizes
INSERT INTO sizes (id, name, slug, sort_order) VALUES
('s1000000-0000-0000-0000-000000000001', 'XS', 'xs', 1),
('s1000000-0000-0000-0000-000000000002', 'S', 's', 2),
('s1000000-0000-0000-0000-000000000003', 'M', 'm', 3),
('s1000000-0000-0000-0000-000000000004', 'L', 'l', 4),
('s1000000-0000-0000-0000-000000000005', 'XL', 'xl', 5);

-- Products
INSERT INTO products (id, category_id, name, slug, subtitle, description, fabric_details, care_instructions, fit_type, base_price, sale_price, is_featured, is_new_arrival) VALUES
(
    'p1000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000001',
    'Architectural Tailored Cord Set',
    'architectural-tailored-cord-set',
    'Cropped Structured Waistcoat & Pleated Wide-Leg Trousers',
    'An exemplary showcase of modern Indian minimalism. Features a sharp square-neck cropped waistcoat paired with fluid high-waisted pleated trousers. Designed for seamless transition from day gallery previews to evening dinners.',
    '70% Fine Merino Wool, 30% Mulberry Silk Blend. Lined with breathable cupro.',
    'Dry clean only. Cool iron on reverse using a press cloth.',
    'Structured Upper, Fluid Wide Leg',
    8990.00,
    7490.00,
    true,
    true
),
(
    'p1000000-0000-0000-0000-000000000002',
    'c1000000-0000-0000-0000-000000000002',
    'Sculpted Monochromatic Blazer',
    'sculpted-monochromatic-blazer',
    'Hourglass Silhouette with Silk Peak Lapels',
    'A masterpiece in tailored precision. Boasts a defined waistline, hand-finished peak lapels, and hidden interior horn buttons. The ultimate editorial armor for the modern woman.',
    '100% Italian Virgin Wool Crepe with Satin Silk facing.',
    'Specialist dry clean only.',
    'Hourglass Tailored Fit',
    12490.00,
    10990.00,
    true,
    false
),
(
    'p1000000-0000-0000-0000-000000000003',
    'c1000000-0000-0000-0000-000000000003',
    'Column Silk Maxi Dress',
    'column-silk-maxi-dress',
    'High Neckline with Dramatic Back Vent',
    'Effortless luxury in liquid silk. Features a statuesque high collar, back cut-out detail, and an elongated column silhouette that sweeps the floor with quiet power.',
    '100% 22 Momme Heavyweight Sandwashed Silk Charmeuse.',
    'Dry clean or gentle hand wash cold with silk detergent.',
    'Relaxed Column Silhouette',
    11200.00,
    9500.00,
    true,
    true
),
(
    'p1000000-0000-0000-0000-000000000004',
    'c1000000-0000-0000-0000-000000000004',
    'Asymmetric Draped Mulberry Silk Top',
    'asymmetric-draped-mulberry-silk-top',
    'Sculptural Shoulder Draping & French Seams',
    'A fluid statement piece engineered with diagonal drape panels that capture light softly. Pairs effortlessly with tailored trousers or denim.',
    '100% Pure Mulberry Silk.',
    'Dry clean recommended.',
    'Fluid Asymmetric Drape',
    5990.00,
    4990.00,
    false,
    true
);

-- Product Colors Links
INSERT INTO product_colors (product_id, color_id, is_default) VALUES
-- Architectural Cord Set in Noir Black and Pearl White
('p1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', true),
('p1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000002', false),
('p1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000003', false),

-- Sculpted Blazer in Noir Black and Charcoal Slate
('p1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', true),
('p1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000004', false),

-- Column Maxi Dress in Noir Black and Pearl White
('p1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000001', true),
('p1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000002', false),

-- Asymmetric Top in Pearl White and Champagne Nude
('p1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000002', true),
('p1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000003', false);

-- Product Sizes Links
INSERT INTO product_sizes (product_id, size_id, stock_quantity, sku) VALUES
('p1000000-0000-0000-0000-000000000001', 's1000000-0000-0000-0000-000000000001', 8, 'OKR-CRD-XS'),
('p1000000-0000-0000-0000-000000000001', 's1000000-0000-0000-0000-000000000002', 15, 'OKR-CRD-S'),
('p1000000-0000-0000-0000-000000000001', 's1000000-0000-0000-0000-000000000003', 12, 'OKR-CRD-M'),
('p1000000-0000-0000-0000-000000000001', 's1000000-0000-0000-0000-000000000004', 6, 'OKR-CRD-L'),

('p1000000-0000-0000-0000-000000000002', 's1000000-0000-0000-0000-000000000002', 10, 'OKR-BLZ-S'),
('p1000000-0000-0000-0000-000000000002', 's1000000-0000-0000-0000-000000000003', 14, 'OKR-BLZ-M'),
('p1000000-0000-0000-0000-000000000002', 's1000000-0000-0000-0000-000000000004', 5, 'OKR-BLZ-L'),

('p1000000-0000-0000-0000-000000000003', 's1000000-0000-0000-0000-000000000001', 5, 'OKR-DRS-XS'),
('p1000000-0000-0000-0000-000000000003', 's1000000-0000-0000-0000-000000000002', 11, 'OKR-DRS-S'),
('p1000000-0000-0000-0000-000000000003', 's1000000-0000-0000-0000-000000000003', 9, 'OKR-DRS-M'),

('p1000000-0000-0000-0000-000000000004', 's1000000-0000-0000-0000-000000000002', 12, 'OKR-TOP-S'),
('p1000000-0000-0000-0000-000000000004', 's1000000-0000-0000-0000-000000000003', 18, 'OKR-TOP-M');

-- ==============================================================================
-- 8. PRODUCT IMAGES (Multi-image, Color-specific, Cover Designated)
-- ==============================================================================

-- 1. Architectural Tailored Cord Set - Noir Black Gallery
INSERT INTO product_images (product_id, color_id, image_url, alt_text, sort_order, is_cover) VALUES
('p1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=80', 'Architectural Cord Set in Noir Black - Cover View', 1, true),
('p1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80', 'Architectural Cord Set in Noir Black - Front Studio Editorial', 2, false),
('p1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80', 'Architectural Cord Set in Noir Black - Side Silhouette', 3, false),
('p1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=80', 'Architectural Cord Set in Noir Black - Fabric & Stitch Detail', 4, false);

-- 1. Architectural Tailored Cord Set - Pearl White Gallery
INSERT INTO product_images (product_id, color_id, image_url, alt_text, sort_order, is_cover) VALUES
('p1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1581044777550-4cfa60707c03?auto=format&fit=crop&w=1200&q=80', 'Architectural Cord Set in Pearl White - Cover View', 1, true),
('p1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80', 'Architectural Cord Set in Pearl White - Movement & Drape', 2, false),
('p1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1200&q=80', 'Architectural Cord Set in Pearl White - Tailoring Detail', 3, false);

-- 1. Architectural Tailored Cord Set - Champagne Nude Gallery
INSERT INTO product_images (product_id, color_id, image_url, alt_text, sort_order, is_cover) VALUES
('p1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80', 'Architectural Cord Set in Champagne Nude - Cover View', 1, true),
('p1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1200&q=80', 'Architectural Cord Set in Champagne Nude - Close Shot', 2, false);

-- 2. Sculpted Monochromatic Blazer - Noir Black Gallery
INSERT INTO product_images (product_id, color_id, image_url, alt_text, sort_order, is_cover) VALUES
('p1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=1200&q=80', 'Sculpted Monochromatic Blazer in Noir Black - Cover View', 1, true),
('p1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80', 'Sculpted Monochromatic Blazer in Noir Black - Editorial Front', 2, false),
('p1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=1200&q=80', 'Sculpted Monochromatic Blazer - Lapel & Button Craftsmanship', 3, false);

-- 2. Sculpted Monochromatic Blazer - Charcoal Slate Gallery
INSERT INTO product_images (product_id, color_id, image_url, alt_text, sort_order, is_cover) VALUES
('p1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80', 'Sculpted Blazer in Charcoal Slate - Cover View', 1, true),
('p1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1520975954732-35dd22299614?auto=format&fit=crop&w=1200&q=80', 'Sculpted Blazer in Charcoal Slate - Studio Angle', 2, false);

-- 3. Column Silk Maxi Dress - Noir Black Gallery
INSERT INTO product_images (product_id, color_id, image_url, alt_text, sort_order, is_cover) VALUES
('p1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1200&q=80', 'Column Silk Maxi Dress in Noir Black - Cover View', 1, true),
('p1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=80', 'Column Silk Maxi Dress in Noir Black - Back Line View', 2, false);

-- 3. Column Silk Maxi Dress - Pearl White Gallery
INSERT INTO product_images (product_id, color_id, image_url, alt_text, sort_order, is_cover) VALUES
('p1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=1200&q=80', 'Column Silk Maxi Dress in Pearl White - Cover View', 1, true),
('p1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?auto=format&fit=crop&w=1200&q=80', 'Column Silk Maxi Dress in Pearl White - Full Length Movement', 2, false);

-- 4. Asymmetric Draped Top - Pearl White & Champagne Nude
INSERT INTO product_images (product_id, color_id, image_url, alt_text, sort_order, is_cover) VALUES
('p1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=1200&q=80', 'Asymmetric Draped Top in Pearl White - Cover View', 1, true),
('p1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80', 'Asymmetric Draped Top - Shoulder Silhouette', 2, false),
('p1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1200&q=80', 'Asymmetric Draped Top in Champagne Nude - Cover View', 1, true);

-- ==============================================================================
-- 9. HELPER VIEWS FOR FAST FULL-PRODUCT FETCHING WITH IMAGES & COLORS
-- ==============================================================================
CREATE OR REPLACE VIEW view_products_full AS
SELECT
    p.id,
    p.name,
    p.slug,
    p.subtitle,
    p.description,
    p.fabric_details,
    p.care_instructions,
    p.fit_type,
    p.base_price,
    p.sale_price,
    p.is_featured,
    p.is_new_arrival,
    p.is_active,
    p.created_at,
    c.id AS category_id,
    c.name AS category_name,
    c.slug AS category_slug,
    (
        SELECT json_agg(
            json_build_object(
                'id', img.id,
                'color_id', img.color_id,
                'image_url', img.image_url,
                'alt_text', img.alt_text,
                'sort_order', img.sort_order,
                'is_cover', img.is_cover,
                'cloudinary_public_id', img.cloudinary_public_id
            ) ORDER BY img.sort_order ASC, img.created_at ASC
        )
        FROM product_images img
        WHERE img.product_id = p.id
    ) AS images,
    (
        SELECT json_agg(
            json_build_object(
                'id', col.id,
                'name', col.name,
                'slug', col.slug,
                'hex_code', col.hex_code,
                'is_default', pc.is_default
            ) ORDER BY col.sort_order ASC
        )
        FROM product_colors pc
        JOIN colors col ON pc.color_id = col.id
        WHERE pc.product_id = p.id AND pc.is_active = true
    ) AS colors,
    (
        SELECT json_agg(
            json_build_object(
                'id', sz.id,
                'name', sz.name,
                'slug', sz.slug,
                'stock_quantity', ps.stock_quantity,
                'sku', ps.sku
            ) ORDER BY sz.sort_order ASC
        )
        FROM product_sizes ps
        JOIN sizes sz ON ps.size_id = sz.id
        WHERE ps.product_id = p.id AND ps.is_active = true
    ) AS sizes
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.is_active = true;

-- End of schema
