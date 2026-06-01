-- GlowLux Cosmetics - Supabase Database Schema
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===================== ENUMS =====================
CREATE TYPE user_role AS ENUM ('customer', 'staff', 'admin');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'online', 'loyalty_points');
CREATE TYPE inventory_action AS ENUM ('restock', 'sale', 'adjustment', 'return', 'damaged');
CREATE TYPE loyalty_tier AS ENUM ('bronze', 'silver', 'gold', 'platinum');
CREATE TYPE transaction_type AS ENUM ('earn', 'redeem', 'expire', 'adjust');

-- ===================== PROFILES =====================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'customer',
  loyalty_tier loyalty_tier DEFAULT 'bronze',
  loyalty_points INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================== CATEGORIES =====================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  parent_id UUID REFERENCES categories(id),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================== PRODUCTS =====================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  short_description TEXT,
  sku TEXT UNIQUE,
  barcode TEXT UNIQUE,
  category_id UUID REFERENCES categories(id),
  price DECIMAL(10,2) NOT NULL,
  compare_at_price DECIMAL(10,2),
  cost_price DECIMAL(10,2),
  images JSONB DEFAULT '[]',
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  loyalty_points_reward INTEGER DEFAULT 0,
  weight_g DECIMAL(8,2),
  ingredients TEXT,
  how_to_use TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================== PRODUCT VARIANTS =====================
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT UNIQUE,
  price DECIMAL(10,2),
  options JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================== INVENTORY =====================
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  reserved_quantity INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 10,
  location TEXT DEFAULT 'main',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, variant_id)
);

-- ===================== INVENTORY TRANSACTIONS =====================
CREATE TABLE inventory_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  action inventory_action NOT NULL,
  quantity_change INTEGER NOT NULL,
  quantity_before INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  notes TEXT,
  reference_id UUID,
  performed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================== CUSTOMER ADDRESSES =====================
CREATE TABLE customer_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label TEXT DEFAULT 'Home',
  full_name TEXT NOT NULL,
  phone TEXT,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT DEFAULT 'US',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================== ORDERS =====================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL DEFAULT 'ORD-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0'),
  customer_id UUID REFERENCES profiles(id),
  status order_status DEFAULT 'pending',
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  shipping_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_method payment_method DEFAULT 'card',
  payment_status TEXT DEFAULT 'pending',
  loyalty_points_used INTEGER DEFAULT 0,
  loyalty_points_earned INTEGER DEFAULT 0,
  shipping_address JSONB,
  notes TEXT,
  is_pos_order BOOLEAN DEFAULT FALSE,
  pos_session_id UUID,
  staff_id UUID REFERENCES profiles(id),
  coupon_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================== ORDER ITEMS =====================
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  product_name TEXT NOT NULL,
  variant_name TEXT,
  sku TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================== CART =====================
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, product_id, variant_id)
);

-- ===================== LOYALTY PROGRAM =====================
CREATE TABLE loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id),
  type transaction_type NOT NULL,
  points INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  description TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE loyalty_tiers_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tier loyalty_tier NOT NULL UNIQUE,
  name TEXT NOT NULL,
  min_points INTEGER NOT NULL,
  discount_percent DECIMAL(4,2) DEFAULT 0,
  points_multiplier DECIMAL(4,2) DEFAULT 1.0,
  free_shipping BOOLEAN DEFAULT FALSE,
  early_access BOOLEAN DEFAULT FALSE,
  birthday_bonus INTEGER DEFAULT 0,
  color TEXT,
  icon TEXT,
  benefits TEXT[]
);

-- Insert default tier configs
INSERT INTO loyalty_tiers_config (tier, name, min_points, discount_percent, points_multiplier, free_shipping, early_access, birthday_bonus, color, icon, benefits) VALUES
  ('bronze', 'Bronze', 0, 0, 1.0, FALSE, FALSE, 50, '#CD7F32', '🥉', ARRAY['1 point per $1 spent', 'Birthday bonus 50 pts', 'Access to member deals']),
  ('silver', 'Silver', 500, 5, 1.25, FALSE, FALSE, 100, '#C0C0C0', '🥈', ARRAY['1.25x points multiplier', '5% member discount', 'Birthday bonus 100 pts', 'Early sale access']),
  ('gold', 'Gold', 2000, 10, 1.5, TRUE, TRUE, 200, '#FFD700', '🥇', ARRAY['1.5x points multiplier', '10% member discount', 'Free shipping', 'Birthday bonus 200 pts', 'Priority support']),
  ('platinum', 'Platinum', 5000, 15, 2.0, TRUE, TRUE, 500, '#E5E4E2', '💎', ARRAY['2x points multiplier', '15% member discount', 'Free shipping always', 'Birthday bonus 500 pts', 'VIP support', 'Exclusive products']);

-- ===================== POS SESSIONS =====================
CREATE TABLE pos_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES profiles(id),
  opening_cash DECIMAL(10,2) DEFAULT 0,
  closing_cash DECIMAL(10,2),
  total_sales DECIMAL(10,2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  notes TEXT
);

-- ===================== REVIEWS =====================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES profiles(id),
  order_id UUID REFERENCES orders(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  body TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================== COUPONS =====================
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT CHECK (discount_type IN ('percent', 'fixed')) NOT NULL,
  discount_value DECIMAL(10,2) NOT NULL,
  minimum_order DECIMAL(10,2) DEFAULT 0,
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================== NOTIFICATIONS =====================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================== INDEXES =====================
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_inventory_product ON inventory(product_id);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_cart_customer ON cart_items(customer_id);
CREATE INDEX idx_loyalty_customer ON loyalty_transactions(customer_id);
CREATE INDEX idx_reviews_product ON reviews(product_id);

-- ===================== ROW LEVEL SECURITY =====================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (TRUE);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Products policies (public read, admin write)
CREATE POLICY "Products are viewable by everyone" ON products FOR SELECT USING (TRUE);
CREATE POLICY "Admins can manage products" ON products FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
);

-- Categories policies
CREATE POLICY "Categories are viewable by everyone" ON categories FOR SELECT USING (TRUE);
CREATE POLICY "Admins can manage categories" ON categories FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
);

-- Inventory policies
CREATE POLICY "Inventory viewable by staff" ON inventory FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
);
CREATE POLICY "Admins can manage inventory" ON inventory FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
);

-- Orders policies
CREATE POLICY "Customers can view own orders" ON orders FOR SELECT USING (customer_id = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
);
CREATE POLICY "Customers can create orders" ON orders FOR INSERT WITH CHECK (customer_id = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
);
CREATE POLICY "Admins can manage orders" ON orders FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
);

-- Order items policies
CREATE POLICY "Order items viewable with order access" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE id = order_id AND (customer_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))))
);
CREATE POLICY "Order items insertable" ON order_items FOR INSERT WITH CHECK (TRUE);

-- Cart policies
CREATE POLICY "Users can manage own cart" ON cart_items FOR ALL USING (customer_id = auth.uid());

-- Loyalty policies
CREATE POLICY "Users can view own loyalty" ON loyalty_transactions FOR SELECT USING (customer_id = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
);

-- Reviews policies
CREATE POLICY "Reviews are publicly viewable" ON reviews FOR SELECT USING (is_published = TRUE);
CREATE POLICY "Users can create reviews" ON reviews FOR INSERT WITH CHECK (customer_id = auth.uid());

-- ===================== TRIGGERS =====================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_inventory_updated BEFORE UPDATE ON inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update loyalty tier based on points
CREATE OR REPLACE FUNCTION update_loyalty_tier()
RETURNS TRIGGER AS $$
BEGIN
  NEW.loyalty_tier = CASE
    WHEN NEW.loyalty_points >= 5000 THEN 'platinum'::loyalty_tier
    WHEN NEW.loyalty_points >= 2000 THEN 'gold'::loyalty_tier
    WHEN NEW.loyalty_points >= 500 THEN 'silver'::loyalty_tier
    ELSE 'bronze'::loyalty_tier
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_loyalty_tier BEFORE UPDATE OF loyalty_points ON profiles
FOR EACH ROW EXECUTE FUNCTION update_loyalty_tier();

-- ===================== SEED DATA =====================

-- Categories
INSERT INTO categories (name, slug, description, display_order) VALUES
  ('Skincare', 'skincare', 'Nourish and protect your skin', 1),
  ('Makeup', 'makeup', 'Enhance your natural beauty', 2),
  ('Fragrance', 'fragrance', 'Luxury scents for every occasion', 3),
  ('Hair Care', 'hair-care', 'Salon-quality hair treatments', 4),
  ('Body Care', 'body-care', 'Indulgent body treatments', 5),
  ('Tools & Accessories', 'tools', 'Professional beauty tools', 6);

-- Sample Products
INSERT INTO products (name, slug, description, short_description, sku, price, compare_at_price, cost_price, category_id, is_featured, loyalty_points_reward, tags, images) VALUES
  ('Radiance Renewal Serum', 'radiance-renewal-serum', 'A luxurious vitamin C serum that brightens and evens skin tone while reducing the appearance of fine lines and hyperpigmentation. Formulated with 20% ascorbic acid and hyaluronic acid.', 'Brightening vitamin C serum for luminous skin', 'SKN-001', 89.00, 110.00, 35.00,
    (SELECT id FROM categories WHERE slug = 'skincare'), TRUE, 89, ARRAY['serum', 'vitamin-c', 'brightening', 'anti-aging'],
    '[{"url": "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600", "alt": "Radiance Renewal Serum"}]'),
  ('Velvet Matte Lipstick - Rose Gold', 'velvet-matte-lipstick-rose-gold', 'Long-lasting matte lipstick with a velvet finish. Enriched with shea butter and vitamin E for comfortable all-day wear.', 'Velvet matte finish, 12hr wear', 'MKP-001', 34.00, 42.00, 12.00,
    (SELECT id FROM categories WHERE slug = 'makeup'), TRUE, 34, ARRAY['lipstick', 'matte', 'rose-gold', 'long-lasting'],
    '[{"url": "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600", "alt": "Rose Gold Lipstick"}]'),
  ('Midnight Rose Eau de Parfum', 'midnight-rose-eau-de-parfum', 'An intoxicating blend of Bulgarian rose, jasmine, sandalwood, and amber. A sophisticated fragrance that evolves beautifully throughout the day.', 'Rose & amber luxury fragrance, 50ml', 'FRG-001', 145.00, 175.00, 55.00,
    (SELECT id FROM categories WHERE slug = 'fragrance'), TRUE, 145, ARRAY['fragrance', 'rose', 'amber', 'luxury', 'edp'],
    '[{"url": "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=600", "alt": "Midnight Rose Perfume"}]'),
  ('Hydra-Boost Moisturizer', 'hydra-boost-moisturizer', 'Intense 24-hour hydration with ceramides and peptides. This lightweight gel-cream locks in moisture and strengthens the skin barrier.', '24hr deep hydration moisturizer', 'SKN-002', 65.00, 80.00, 25.00,
    (SELECT id FROM categories WHERE slug = 'skincare'), TRUE, 65, ARRAY['moisturizer', 'hydrating', 'ceramides', 'gel-cream'],
    '[{"url": "https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?w=600", "alt": "Hydra-Boost Moisturizer"}]'),
  ('Silk Illuminating Foundation', 'silk-illuminating-foundation', 'Buildable coverage foundation with a luminous satin finish. Contains SPF 30 and light-reflecting particles for a natural glow.', 'Buildable coverage, SPF 30, luminous finish', 'MKP-002', 52.00, 65.00, 20.00,
    (SELECT id FROM categories WHERE slug = 'makeup'), FALSE, 52, ARRAY['foundation', 'spf', 'luminous', 'buildable'],
    '[{"url": "https://images.unsplash.com/photo-1512207736890-6ffed8a84e8d?w=600", "alt": "Silk Foundation"}]'),
  ('Repair & Restore Hair Mask', 'repair-restore-hair-mask', 'Intensive deep conditioning treatment with keratin proteins and argan oil. Repairs damage, eliminates frizz, and restores shine in one treatment.', 'Intensive keratin & argan hair treatment', 'HCR-001', 48.00, 60.00, 18.00,
    (SELECT id FROM categories WHERE slug = 'hair-care'), FALSE, 48, ARRAY['hair-mask', 'keratin', 'argan', 'repair'],
    '[{"url": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600", "alt": "Hair Mask"}]'),
  ('Rose Quartz Facial Roller', 'rose-quartz-facial-roller', 'Authentic rose quartz facial roller for lymphatic drainage and product absorption. Reduces puffiness and promotes a sculpted, lifted appearance.', 'Authentic rose quartz for de-puffing', 'TLS-001', 42.00, 55.00, 15.00,
    (SELECT id FROM categories WHERE slug = 'tools'), TRUE, 42, ARRAY['facial-roller', 'rose-quartz', 'de-puffing', 'tool'],
    '[{"url": "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600", "alt": "Rose Quartz Roller"}]'),
  ('Luxury Body Butter - Vanilla & Shea', 'luxury-body-butter-vanilla-shea', 'Rich whipped body butter with pure shea butter, coconut oil, and vanilla extract. Melts into skin for 48-hour hydration without greasiness.', '48hr hydration whipped body butter', 'BDY-001', 38.00, 48.00, 14.00,
    (SELECT id FROM categories WHERE slug = 'body-care'), FALSE, 38, ARRAY['body-butter', 'shea', 'vanilla', 'hydrating'],
    '[{"url": "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600", "alt": "Body Butter"}]');

-- Seed inventory for all products
INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold)
SELECT id,
  FLOOR(RANDOM() * 150 + 20)::INTEGER,
  FLOOR(RANDOM() * 5)::INTEGER,
  10
FROM products;
