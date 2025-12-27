-- ResellerHub AI Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    name TEXT NOT NULL,
    phone TEXT,
    google_id TEXT,
    plan TEXT DEFAULT 'trial',
    trial_ends_at TEXT,
    created_at TEXT,
    updated_at TEXT
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    sku TEXT,
    cost_price REAL DEFAULT 0,
    sell_price REAL DEFAULT 0,
    stock INTEGER DEFAULT 0,
    image_url TEXT,
    category TEXT,
    status TEXT DEFAULT 'active',
    created_at TEXT,
    updated_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Product Platforms (sync to marketplaces)
CREATE TABLE IF NOT EXISTS product_platforms (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    platform TEXT NOT NULL,
    platform_product_id TEXT,
    platform_url TEXT,
    platform_price REAL,
    sync_status TEXT DEFAULT 'pending',
    last_synced_at TEXT,
    created_at TEXT,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Price Tracking (competitor prices)
CREATE TABLE IF NOT EXISTS price_tracking (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    competitor_name TEXT,
    competitor_url TEXT,
    competitor_price REAL,
    platform TEXT,
    tracked_at TEXT,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Price Alerts
CREATE TABLE IF NOT EXISTS price_alerts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    product_id TEXT,
    alert_type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    read INTEGER DEFAULT 0,
    created_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    platform TEXT,
    quantity INTEGER DEFAULT 1,
    total_amount REAL,
    profit REAL,
    order_date TEXT,
    created_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Analytics (daily snapshots)
CREATE TABLE IF NOT EXISTS analytics (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    date TEXT NOT NULL,
    total_revenue REAL DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    total_profit REAL DEFAULT 0,
    avg_margin REAL DEFAULT 0,
    created_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
