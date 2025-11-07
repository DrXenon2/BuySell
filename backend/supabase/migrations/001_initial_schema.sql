-- Migration initiale - Structure de base de données complète
-- Crée toutes les tables, indexes, contraintes et politiques RLS

BEGIN;

-- Extensions PostgreSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Enumérations
CREATE TYPE user_role AS ENUM ('customer', 'seller', 'admin', 'moderator');
CREATE TYPE order_status AS ENUM (
  'pending', 'confirmed', 'processing', 'shipped', 'delivered', 
  'cancelled', 'refunded', 'payment_failed'
);
CREATE TYPE payment_status AS ENUM (
  'requires_payment_method', 'requires_confirmation', 'requires_action',
  'processing', 'succeeded', 'failed', 'refunded', 'canceled'
);
CREATE TYPE notification_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE discount_type AS ENUM ('percentage', 'fixed', 'free_shipping');

-- Tables principales
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  bio TEXT,
  company_name TEXT,
  website TEXT,
  location TEXT,
  language TEXT DEFAULT 'fr',
  currency TEXT DEFAULT 'XOF',
  email_verified BOOLEAN DEFAULT false,
  last_password_change TIMESTAMPTZ,
  last_login TIMESTAMPTZ,
  login_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_settings (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  push_notifications BOOLEAN DEFAULT true,
  newsletter_subscribed BOOLEAN DEFAULT true,
  two_factor_enabled BOOLEAN DEFAULT false,
  privacy_level TEXT DEFAULT 'public' CHECK (privacy_level IN ('public', 'private', 'friends_only')),
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  language TEXT DEFAULT 'fr',
  currency TEXT DEFAULT 'XOF',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Tables principales
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES categories(id),
  is_official_store BOOLEAN DEFAULT false,
  is_djassa BOOLEAN DEFAULT false,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  stock_quantity INTEGER DEFAULT 0,
  sku VARCHAR(100) UNIQUE,
  category_id UUID REFERENCES categories(id) NOT NULL,
  seller_id UUID REFERENCES users(id) NOT NULL,
  brand VARCHAR(100),
  condition VARCHAR(20) DEFAULT 'new', -- new, used, refurbished
  is_featured BOOLEAN DEFAULT false,
  is_second_hand BOOLEAN DEFAULT false,
  weight DECIMAL(8,2),
  dimensions JSONB,
  specifications JSONB,
  rating DECIMAL(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  sold_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE product_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text VARCHAR(200),
  sort_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url TEXT,
  role VARCHAR(20) DEFAULT 'customer', -- customer, seller, admin
  is_verified BOOLEAN DEFAULT false,
  date_of_birth DATE,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE seller_profiles (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  store_name TEXT NOT NULL,
  store_slug TEXT UNIQUE NOT NULL,
  store_description TEXT,
  store_logo TEXT,
  store_banner TEXT,
  store_address JSONB,
  store_phone TEXT,
  store_email TEXT,
  business_type TEXT,
  tax_number TEXT,
  bank_account TEXT,
  payment_methods TEXT[] DEFAULT '{}',
  delivery_options TEXT[] DEFAULT '{}',
  rating DECIMAL(3,2) DEFAULT 0.0,
  total_sales INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  verification_data JSONB,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  parent_id BIGINT REFERENCES categories(id),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(12,2) NOT NULL CHECK (price >= 0),
  compare_price DECIMAL(12,2) CHECK (compare_price >= 0),
  cost_price DECIMAL(12,2) CHECK (cost_price >= 0),
  sku TEXT UNIQUE,
  barcode TEXT,
  quantity INTEGER DEFAULT 0,
  track_quantity BOOLEAN DEFAULT true,
  weight DECIMAL(8,2) DEFAULT 0,
  dimensions JSONB,
  images TEXT[] DEFAULT '{}',
  specifications JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  is_available BOOLEAN DEFAULT true,
  is_published BOOLEAN DEFAULT true,
  category_id BIGINT REFERENCES categories(id),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  search_vector TSVECTOR,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE addresses (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('shipping', 'billing')),
  street TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT,
  country TEXT NOT NULL DEFAULT 'SN',
  is_default BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status order_status DEFAULT 'pending',
  subtotal DECIMAL(12,2) NOT NULL CHECK (subtotal >= 0),
  shipping_cost DECIMAL(12,2) DEFAULT 0 CHECK (shipping_cost >= 0),
  tax_amount DECIMAL(12,2) DEFAULT 0 CHECK (tax_amount >= 0),
  discount_amount DECIMAL(12,2) DEFAULT 0 CHECK (discount_amount >= 0),
  total_amount DECIMAL(12,2) NOT NULL CHECK (total_amount >= 0),
  items_count INTEGER DEFAULT 0,
  shipping_address JSONB NOT NULL,
  billing_address JSONB,
  coupon_id BIGINT, -- Référence à ajouter après création de coupons
  cancellation_reason TEXT,
  cancelled_by UUID REFERENCES profiles(id),
  paid_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  status_updated_at TIMESTAMPTZ,
  refund_amount DECIMAL(12,2) DEFAULT 0,
  admin_notes TEXT,
  tracking_number TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES products(id),
  variant_id BIGINT, -- Pour les variations de produits
  product_name TEXT NOT NULL,
  product_sku TEXT,
  product_image TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(12,2) NOT NULL CHECK (unit_price >= 0),
  total_price DECIMAL(12,2) NOT NULL CHECK (total_price >= 0),
  specifications JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE payments (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  payment_intent_id TEXT UNIQUE,
  client_secret TEXT,
  amount DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
  currency TEXT DEFAULT 'XOF',
  status payment_status DEFAULT 'requires_payment_method',
  payment_method TEXT,
  payment_method_id TEXT,
  save_payment_method BOOLEAN DEFAULT false,
  transaction_id TEXT,
  failure_message TEXT,
  refund_amount DECIMAL(12,2) DEFAULT 0,
  processed_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE transactions (
  id BIGSERIAL PRIMARY KEY,
  payment_id BIGINT REFERENCES payments(id),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('payment', 'refund', 'withdrawal')),
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'XOF',
  status TEXT NOT NULL,
  gateway TEXT NOT NULL,
  gateway_transaction_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reviews (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  order_id BIGINT REFERENCES orders(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  images TEXT[] DEFAULT '{}',
  is_verified BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  helpful_count INTEGER DEFAULT 0,
  report_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, user_id, order_id)
);

CREATE TABLE cart_items (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
  variant_id BIGINT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id, variant_id) WHERE is_active = true
);

CREATE TABLE coupons (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  discount_type discount_type NOT NULL,
  discount_value DECIMAL(12,2) NOT NULL CHECK (discount_value >= 0),
  max_discount_amount DECIMAL(12,2),
  usage_limit INTEGER,
  user_usage_limit INTEGER DEFAULT 1,
  times_used INTEGER DEFAULT 0,
  min_order_amount DECIMAL(12,2),
  first_order_only BOOLEAN DEFAULT false,
  applicable_product_ids BIGINT[],
  applicable_category_ids BIGINT[],
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  campaign_name TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ajouter la contrainte foreign key pour coupons dans orders
ALTER TABLE orders ADD CONSTRAINT orders_coupon_id_fkey 
  FOREIGN KEY (coupon_id) REFERENCES coupons(id);

CREATE TABLE notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  action_label TEXT,
  priority notification_priority DEFAULT 'medium',
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notification_recipients (
  id BIGSERIAL PRIMARY KEY,
  notification_id BIGINT REFERENCES notifications(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(notification_id, user_id)
);

-- Tables de logging et audit
CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id BIGINT,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE error_logs (
  id BIGSERIAL PRIMARY KEY,
  function_name TEXT NOT NULL,
  error_message TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id),
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE webhook_logs (
  id BIGSERIAL PRIMARY KEY,
  provider TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE coupon_validations (
  id BIGSERIAL PRIMARY KEY,
  coupon_id BIGINT REFERENCES coupons(id),
  user_id UUID REFERENCES profiles(id),
  order_amount DECIMAL(12,2),
  is_valid BOOLEAN NOT NULL,
  validation_result JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE analytics_events (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  event_type TEXT NOT NULL,
  event_name TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE database_backups (
  id BIGSERIAL PRIMARY KEY,
  backup_id TEXT UNIQUE NOT NULL,
  filename TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed', 'failed')),
  file_size BIGINT,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_by TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE email_queue (
  id BIGSERIAL PRIMARY KEY,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  template_name TEXT,
  template_data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  priority TEXT DEFAULT 'medium',
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table d'archive pour les logs d'audit anciens
CREATE TABLE audit_logs_archive (
  LIKE audit_logs INCLUDING ALL
);

COMMIT;

