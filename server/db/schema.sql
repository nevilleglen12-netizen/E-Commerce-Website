-- ShopEase PostgreSQL schema
-- Run with: psql -U postgres -d shopease -f schema.sql

-- ===========================================================
-- CATEGORIES
-- ===========================================================
CREATE TABLE IF NOT EXISTS categories (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  slug        VARCHAR(100) NOT NULL UNIQUE,
  icon        VARCHAR(10) DEFAULT '🛍️',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================================
-- PRODUCTS
-- ===========================================================
CREATE TABLE IF NOT EXISTS products (
  id              SERIAL PRIMARY KEY,
  category_id     INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  description     TEXT,
  brand           VARCHAR(100),
  price           NUMERIC(12,2) NOT NULL,
  original_price  NUMERIC(12,2) DEFAULT NULL,
  stock_qty       INTEGER NOT NULL DEFAULT 0,
  image_url       VARCHAR(500) NOT NULL,
  rating          NUMERIC(2,1) DEFAULT 4.0,
  reviews_count   INTEGER DEFAULT 0,
  is_featured     BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_price ON products (price);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products (is_featured);

-- ===========================================================
-- CUSTOMERS
-- ===========================================================
CREATE TABLE IF NOT EXISTS customers (
  id              SERIAL PRIMARY KEY,
  first_name      VARCHAR(100) NOT NULL,
  last_name       VARCHAR(100) NOT NULL,
  email           VARCHAR(255) NOT NULL UNIQUE,
  phone           VARCHAR(30) NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  address         VARCHAR(255),
  city            VARCHAR(100),
  country         VARCHAR(100),
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================================
-- ORDERS
-- ===========================================================
CREATE TABLE IF NOT EXISTS orders (
  id                  SERIAL PRIMARY KEY,
  order_number        VARCHAR(40) NOT NULL UNIQUE,
  customer_id         INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  status              VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','processing','shipped','delivered','cancelled')),
  payment_method      VARCHAR(30) NOT NULL DEFAULT 'cash_on_delivery' CHECK (payment_method IN ('cash_on_delivery','mpesa','card')),
  shipping_address    VARCHAR(255) NOT NULL,
  shipping_city       VARCHAR(100) NOT NULL,
  notes               TEXT,
  subtotal            NUMERIC(12,2) NOT NULL,
  shipping_fee        NUMERIC(12,2) NOT NULL DEFAULT 200.00,
  total               NUMERIC(12,2) NOT NULL,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders (customer_id);

-- ===========================================================
-- ORDER ITEMS
-- ===========================================================
CREATE TABLE IF NOT EXISTS order_items (
  id            SERIAL PRIMARY KEY,
  order_id      INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id    INTEGER NOT NULL REFERENCES products(id),
  product_name  VARCHAR(255) NOT NULL,
  unit_price    NUMERIC(12,2) NOT NULL,
  quantity      INTEGER NOT NULL
);
