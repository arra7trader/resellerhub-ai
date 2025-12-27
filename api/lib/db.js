/**
 * Turso Database Connection
 * Cloud SQLite database for ResellerHub AI
 */

import { createClient } from '@libsql/client';

let db = null;

export function getDb() {
    if (!db) {
        db = createClient({
            url: process.env.TURSO_DATABASE_URL,
            authToken: process.env.TURSO_AUTH_TOKEN
        });
    }
    return db;
}

/**
 * Execute a query and return results
 */
export async function query(sql, params = []) {
    const client = getDb();
    try {
        const result = await client.execute({ sql, args: params });
        return result.rows;
    } catch (error) {
        console.error('Database error:', error);
        throw error;
    }
}

/**
 * Execute a query and return single row
 */
export async function queryOne(sql, params = []) {
    const rows = await query(sql, params);
    return rows[0] || null;
}

/**
 * Execute insert/update/delete and return result
 */
export async function execute(sql, params = []) {
    const client = getDb();
    try {
        const result = await client.execute({ sql, args: params });
        return {
            rowsAffected: result.rowsAffected,
            lastInsertRowid: result.lastInsertRowid
        };
    } catch (error) {
        console.error('Database error:', error);
        throw error;
    }
}

/**
 * Initialize database schema
 */
export async function initSchema() {
    const client = getDb();

    const schema = `
        -- Users table
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            name TEXT NOT NULL,
            phone TEXT,
            plan TEXT DEFAULT 'free',
            plan_expires_at TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        -- Plans table
        CREATE TABLE IF NOT EXISTS plans (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            price INTEGER NOT NULL,
            max_products INTEGER DEFAULT 10,
            max_platforms INTEGER DEFAULT 1,
            features TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        -- Payments table
        CREATE TABLE IF NOT EXISTS payments (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            plan_id TEXT NOT NULL,
            amount INTEGER NOT NULL,
            bank_name TEXT,
            proof_url TEXT,
            status TEXT DEFAULT 'pending',
            confirmed_by TEXT,
            confirmed_at TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        -- Products table
        CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            name TEXT NOT NULL,
            sku TEXT,
            category TEXT,
            cost_price INTEGER DEFAULT 0,
            sell_price INTEGER DEFAULT 0,
            stock INTEGER DEFAULT 0,
            description TEXT,
            image_url TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        -- Price Alerts table
        CREATE TABLE IF NOT EXISTS price_alerts (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            product_id TEXT,
            alert_type TEXT,
            title TEXT NOT NULL,
            message TEXT,
            is_read INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        -- Insert default plans
        INSERT OR IGNORE INTO plans (id, name, price, max_products, max_platforms, features) VALUES
        ('free', 'Free', 0, 10, 1, '["Dashboard Basic","10 Produk","1 Platform"]'),
        ('starter', 'Starter', 49000, 50, 2, '["Semua fitur Free","50 Produk","2 Platform","Price Intel Basic"]'),
        ('pro', 'Pro', 149000, 500, 5, '["Semua fitur Starter","500 Produk","5 Platform","AI Insights","Priority Support"]'),
        ('business', 'Business', 499000, -1, -1, '["Unlimited Produk","Unlimited Platform","Dedicated Support","Custom Integration"]');
    `;

    const statements = schema.split(';').filter(s => s.trim());
    for (const sql of statements) {
        if (sql.trim()) {
            await client.execute(sql);
        }
    }

    console.log('Database schema initialized');
}

export default { getDb, query, queryOne, execute, initSchema };
