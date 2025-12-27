/**
 * Products API - Single Product Operations
 * GET /api/products/[id] - Get product by ID
 * PUT /api/products/[id] - Update product
 * DELETE /api/products/[id] - Delete product
 */

import { queryOne, execute } from '../../lib/db.js';
import { verifyToken, extractToken } from '../../lib/auth.js';

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
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
    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ error: 'Product ID required' });
    }

    try {
        // Verify ownership
        const product = await queryOne(
            'SELECT * FROM products WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (!product) {
            return res.status(404).json({ error: 'Produk tidak ditemukan' });
        }

        if (req.method === 'GET') {
            return res.status(200).json(product);
        }

        if (req.method === 'PUT') {
            const { name, sku, category, cost_price, sell_price, stock, description, image_url } = req.body;

            await execute(
                `UPDATE products SET 
                    name = COALESCE(?, name),
                    sku = COALESCE(?, sku),
                    category = COALESCE(?, category),
                    cost_price = COALESCE(?, cost_price),
                    sell_price = COALESCE(?, sell_price),
                    stock = COALESCE(?, stock),
                    description = COALESCE(?, description),
                    image_url = COALESCE(?, image_url),
                    updated_at = CURRENT_TIMESTAMP
                 WHERE id = ? AND user_id = ?`,
                [name, sku, category, cost_price, sell_price, stock, description, image_url, id, userId]
            );

            const updated = await queryOne(
                'SELECT * FROM products WHERE id = ?',
                [id]
            );

            return res.status(200).json({
                message: 'Produk berhasil diupdate',
                product: updated
            });
        }

        if (req.method === 'DELETE') {
            await execute(
                'DELETE FROM products WHERE id = ? AND user_id = ?',
                [id, userId]
            );

            return res.status(200).json({
                message: 'Produk berhasil dihapus'
            });
        }

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (error) {
        console.error('Product API error:', error);
        return res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
}
