/**
 * Products API - List & Create
 * GET /api/products - Get all products for user
 * POST /api/products - Create new product
 */

import { v4 as uuidv4 } from 'uuid';
import { query, execute } from '../../lib/db.js';
import { verifyToken, extractToken } from '../../lib/auth.js';

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Auth check
    const token = extractToken(req.headers.authorization);
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = decoded.id;

    try {
        if (req.method === 'GET') {
            // Get all products for user
            const products = await query(
                `SELECT * FROM products WHERE user_id = ? ORDER BY created_at DESC`,
                [userId]
            );
            return res.status(200).json(products);
        }

        if (req.method === 'POST') {
            const { name, sku, category, cost_price, sell_price, stock, description, image_url } = req.body;

            if (!name) {
                return res.status(400).json({ error: 'Nama produk wajib diisi' });
            }

            const productId = uuidv4();

            await execute(
                `INSERT INTO products (id, user_id, name, sku, category, cost_price, sell_price, stock, description, image_url)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [productId, userId, name, sku || null, category || null,
                    cost_price || 0, sell_price || 0, stock || 0, description || null, image_url || null]
            );

            const product = await query(
                'SELECT * FROM products WHERE id = ?',
                [productId]
            );

            return res.status(201).json({
                message: 'Produk berhasil ditambahkan',
                product: product[0]
            });
        }

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (error) {
        console.error('Products API error:', error);
        return res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
}
