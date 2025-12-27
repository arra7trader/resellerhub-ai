/**
 * ResellerHub AI - Database Helper
 */
const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, 'resellerhub.db');
let db = null;
let SQL = null;

async function initDatabase() {
    if (db) return db;
    SQL = await initSqlJs();
    try {
        if (fs.existsSync(DB_PATH)) {
            const fileBuffer = fs.readFileSync(DB_PATH);
            db = new SQL.Database(fileBuffer);
            console.log('✅ Database loaded');
        } else {
            db = new SQL.Database();
            console.log('✅ New database created');
        }
    } catch (error) {
        db = new SQL.Database();
        console.log('✅ New database created');
    }
    initSchema();
    return db;
}

function saveDatabase() {
    if (!db) return;
    try {
        const data = db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(DB_PATH, buffer);
    } catch (error) {
        console.error('Failed to save database:', error);
    }
}

function initSchema() {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    const statements = schema.split(';').filter(s => s.trim());
    for (const stmt of statements) {
        try { db.run(stmt); } catch (e) { }
    }
    console.log('✅ Schema initialized');
    saveDatabase();
}

function generateId(prefix = '') {
    return prefix ? `${prefix}_${uuidv4().substring(0, 8)}` : uuidv4();
}

function now() { return new Date().toISOString(); }

function runQuery(sql, params = []) {
    try { db.run(sql, params); saveDatabase(); return true; }
    catch (error) { console.error('Query error:', error); return false; }
}

function getOne(sql, params = []) {
    try {
        const stmt = db.prepare(sql);
        stmt.bind(params);
        if (stmt.step()) { const row = stmt.getAsObject(); stmt.free(); return row; }
        stmt.free();
        return null;
    } catch (error) { console.error('GetOne error:', error); return null; }
}

function getAll(sql, params = []) {
    try {
        const stmt = db.prepare(sql);
        stmt.bind(params);
        const rows = [];
        while (stmt.step()) { rows.push(stmt.getAsObject()); }
        stmt.free();
        return rows;
    } catch (error) { console.error('GetAll error:', error); return []; }
}

// Users
const users = {
    findByEmail: (email) => getOne('SELECT * FROM users WHERE email = ?', [email]),
    findById: (id) => getOne('SELECT * FROM users WHERE id = ?', [id]),
    create: (data) => {
        const id = generateId('usr');
        const trialEnds = new Date();
        trialEnds.setDate(trialEnds.getDate() + 14);
        runQuery(`INSERT INTO users (id, email, password_hash, name, phone, plan, trial_ends_at, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, data.email, data.password_hash || null, data.name, data.phone || null, 'trial', trialEnds.toISOString(), now()]);
        return users.findById(id);
    },
    update: (id, data) => {
        const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
        const values = [...Object.values(data), now(), id];
        runQuery(`UPDATE users SET ${fields}, updated_at = ? WHERE id = ?`, values);
        return users.findById(id);
    }
};

// Products
const products = {
    findByUserId: (userId) => getAll('SELECT * FROM products WHERE user_id = ? ORDER BY created_at DESC', [userId]),
    findById: (id) => getOne('SELECT * FROM products WHERE id = ?', [id]),
    create: (data) => {
        const id = generateId('prd');
        runQuery(`INSERT INTO products (id, user_id, name, description, sku, cost_price, sell_price, stock, category, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, data.user_id, data.name, data.description || null, data.sku || null, data.cost_price || 0, data.sell_price || 0, data.stock || 0, data.category || null, now()]);
        return products.findById(id);
    },
    update: (id, data) => {
        const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
        runQuery(`UPDATE products SET ${fields}, updated_at = ? WHERE id = ?`, [...Object.values(data), now(), id]);
        return products.findById(id);
    },
    delete: (id) => runQuery('DELETE FROM products WHERE id = ?', [id])
};

// Price Alerts
const priceAlerts = {
    findByUserId: (userId) => getAll('SELECT * FROM price_alerts WHERE user_id = ? ORDER BY created_at DESC LIMIT 20', [userId]),
    create: (data) => {
        const id = generateId('alt');
        runQuery(`INSERT INTO price_alerts (id, user_id, product_id, alert_type, title, message, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [id, data.user_id, data.product_id || null, data.alert_type, data.title, data.message || null, now()]);
        return getOne('SELECT * FROM price_alerts WHERE id = ?', [id]);
    },
    markRead: (id) => runQuery('UPDATE price_alerts SET read = 1 WHERE id = ?', [id]),
    countUnread: (userId) => {
        const result = getOne('SELECT COUNT(*) as count FROM price_alerts WHERE user_id = ? AND read = 0', [userId]);
        return result ? result.count : 0;
    }
};

// Analytics
const analytics = {
    getDashboard: (userId) => {
        const today = new Date().toISOString().split('T')[0];
        return getOne('SELECT * FROM analytics WHERE user_id = ? AND date = ?', [userId, today]) || {
            total_revenue: 18500000, total_orders: 378, total_profit: 5920000, avg_margin: 32
        };
    }
};

module.exports = {
    initDatabase, db: () => db, generateId, now, runQuery, getOne, getAll,
    users, products, priceAlerts, analytics
};
