export const schemaSql = `
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(15) UNIQUE NOT NULL,
  role VARCHAR(20),
  name VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT users_role_check CHECK (role IS NULL OR role IN ('buyer', 'seller'))
);

CREATE TABLE IF NOT EXISTS buyer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS seller_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shop_name VARCHAR(150),
  service_lat NUMERIC(9,6),
  service_lng NUMERIC(9,6),
  service_radius_km NUMERIC(6,2) NOT NULL DEFAULT 5,
  rating NUMERIC(2,1) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  category VARCHAR(50),
  unit VARCHAR(20),
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES seller_profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  price NUMERIC(8,2) NOT NULL,
  stock_qty NUMERIC(10,2) NOT NULL DEFAULT 0,
  unit VARCHAR(20) NOT NULL,
  in_stock BOOLEAN NOT NULL DEFAULT true,
  image_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (seller_id, product_id)
);

CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label VARCHAR(30) NOT NULL DEFAULT 'home',
  full_address TEXT NOT NULL,
  lat NUMERIC(9,6),
  lng NUMERIC(9,6),
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity NUMERIC(10,2) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  preferred_price NUMERIC(8,2),
  buyer_lat NUMERIC(9,6) NOT NULL,
  buyer_lng NUMERIC(9,6) NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS market_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES buyer_profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT market_requests_status_check CHECK (status IN ('pending', 'assigned', 'completed', 'expired', 'cancelled'))
);

CREATE TABLE IF NOT EXISTS market_request_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES market_requests(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity NUMERIC(10,2) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  preferred_price NUMERIC(8,2),
  buyer_lat NUMERIC(9,6) NOT NULL,
  buyer_lng NUMERIC(9,6) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT market_request_items_status_check CHECK (status IN ('pending', 'assigned', 'expired', 'cancelled'))
);

CREATE TABLE IF NOT EXISTS order_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_item_id UUID UNIQUE NOT NULL REFERENCES market_request_items(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES seller_profiles(id) ON DELETE CASCADE,
  status VARCHAR(30) NOT NULL DEFAULT 'accepted',
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT order_assignments_status_check CHECK (status IN ('accepted', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'))
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform VARCHAR(20) NOT NULL,
  token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, token)
);

CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(15) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_seller ON inventory_items (seller_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory_items (product_id);
CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses (user_id);
CREATE INDEX IF NOT EXISTS idx_market_requests_status_created ON market_requests (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_request_items_request ON market_request_items (request_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user ON cart_items (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications (user_id, created_at DESC);
`;
