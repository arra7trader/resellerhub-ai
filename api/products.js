/**
 * Products API - All product endpoints
 * GET /api/products - Get all products
 * POST /api/products - Create product
 * PUT /api/products?id=xxx - Update product
 * DELETE /api/products?id=xxx - Delete product
 */

import { v4 as uuidv4 } from 'uuid';
import { query, queryOne, execute } from './_lib/db.js';
import { verifyToken, extractToken } from './_lib/auth.js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const token = extractToken(req.headers.authorization);
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const decoded = verifyToken(token);
    if (!decoded) return res.status(401).json({ error: 'Invalid token' });

    const userId = decoded.id;
    const productId = req.query.id;

    try {
        if (req.method === 'GET') {
            if (productId) {
                const product = await queryOne('SELECT * FROM products WHERE id = ? AND user_id = ?', [productId, userId]);
                if (!product) return res.status(404).json({ error: 'Produk tidak ditemukan' });
                return res.status(200).json(product);
            }
            const products = await query('SELECT * FROM products WHERE user_id = ? ORDER BY created_at DESC', [userId]);
            return res.status(200).json(products);
        }

        if (req.method === 'POST') {
            const { name, sku, category, cost_price, sell_price, stock, description, image_url } = req.body;
            if (!name) return res.status(400).json({ error: 'Nama produk wajib diisi' });

            const newId = uuidv4();
            await execute(
                `INSERT INTO products (id, user_id, name, sku, category, cost_price, sell_price, stock, description, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [newId, userId, name, sku || null, category || null, cost_price || 0, sell_price || 0, stock || 0, description || null, image_url || null]
            );
            const product = await queryOne('SELECT * FROM products WHERE id = ?', [newId]);
            return res.status(201).json({ message: 'Produk berhasil ditambahkan', product });
        }

        if (req.method === 'PUT') {
            if (!productId) return res.status(400).json({ error: 'Product ID required' });
            const existing = await queryOne('SELECT * FROM products WHERE id = ? AND user_id = ?', [productId, userId]);
            if (!existing) return res.status(404).json({ error: 'Produk tidak ditemukan' });

            const { name, sku, category, cost_price, sell_price, stock, description, image_url } = req.body;
            await execute(
                `UPDATE products SET name = COALESCE(?, name), sku = COALESCE(?, sku), category = COALESCE(?, category), cost_price = COALESCE(?, cost_price), sell_price = COALESCE(?, sell_price), stock = COALESCE(?, stock), description = COALESCE(?, description), image_url = COALESCE(?, image_url), updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`,
                [name, sku, category, cost_price, sell_price, stock, description, image_url, productId, userId]
            );
            const updated = await queryOne('SELECT * FROM products WHERE id = ?', [productId]);
            return res.status(200).json({ message: 'Produk berhasil diupdate', product: updated });
        }

        if (req.method === 'DELETE') {
            if (!productId) return res.status(400).json({ error: 'Product ID required' });
            await execute('DELETE FROM products WHERE id = ? AND user_id = ?', [productId, userId]);
            return res.status(200).json({ message: 'Produk berhasil dihapus' });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Products error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
}
