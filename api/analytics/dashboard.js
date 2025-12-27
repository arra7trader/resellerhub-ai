/**
 * Analytics API - Dashboard Stats
 * GET /api/analytics/dashboard - Get dashboard statistics
 */

import { query, queryOne } from '../../lib/db.js';
import { verifyToken, extractToken } from '../../lib/auth.js';

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
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
        // Get product count
        const productCount = await queryOne(
            'SELECT COUNT(*) as count FROM products WHERE user_id = ?',
            [userId]
        );

        // Get total stock value
        const stockValue = await queryOne(
            'SELECT SUM(cost_price * stock) as value FROM products WHERE user_id = ?',
            [userId]
        );

        // Get potential revenue
        const potentialRevenue = await queryOne(
            'SELECT SUM(sell_price * stock) as value FROM products WHERE user_id = ?',
            [userId]
        );

        // Get average margin
        const avgMargin = await queryOne(
            `SELECT AVG(
                CASE WHEN sell_price > 0 
                THEN ((sell_price - cost_price) * 100.0 / sell_price) 
                ELSE 0 END
            ) as margin FROM products WHERE user_id = ? AND sell_price > 0`,
            [userId]
        );

        // Get unread alerts count
        const alertsCount = await queryOne(
            'SELECT COUNT(*) as count FROM price_alerts WHERE user_id = ? AND is_read = 0',
            [userId]
        );

        // Get top products
        const topProducts = await query(
            `SELECT name, sell_price, stock, 
                CASE WHEN sell_price > 0 
                THEN ROUND((sell_price - cost_price) * 100.0 / sell_price, 1) 
                ELSE 0 END as margin
             FROM products 
             WHERE user_id = ? 
             ORDER BY (sell_price * stock) DESC 
             LIMIT 5`,
            [userId]
        );

        return res.status(200).json({
            totalProducts: productCount?.count || 0,
            stockValue: stockValue?.value || 0,
            potentialRevenue: potentialRevenue?.value || 0,
            avgMargin: Math.round(avgMargin?.margin || 0),
            priceAlerts: alertsCount?.count || 0,
            topProducts
        });

    } catch (error) {
        console.error('Analytics API error:', error);
        return res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
}
