/**
 * Analytics Routes
 */
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('./auth');
const { analytics } = require('../db/database');

// Get dashboard stats
router.get('/dashboard', authMiddleware, (req, res) => {
    try {
        const stats = analytics.getDashboard(req.user.id);
        res.json({
            totalRevenue: stats.total_revenue,
            totalOrders: stats.total_orders,
            totalProfit: stats.total_profit,
            avgMargin: stats.avg_margin,
            revenueChange: 12,
            ordersChange: 8
        });
    } catch (error) {
        res.status(500).json({ error: 'Terjadi kesalahan' });
    }
});

// Get platform stats
router.get('/platforms', authMiddleware, (req, res) => {
    try {
        res.json({
            platforms: [
                { name: 'Shopee', revenue: 8500000, orders: 156, percentage: 45 },
                { name: 'Tokopedia', revenue: 6200000, orders: 124, percentage: 35 },
                { name: 'TikTok Shop', revenue: 3800000, orders: 98, percentage: 20 }
            ]
        });
    } catch (error) {
        res.status(500).json({ error: 'Terjadi kesalahan' });
    }
});

// Get product performance
router.get('/products', authMiddleware, (req, res) => {
    try {
        res.json({
            topProducts: [
                { name: 'iPhone 15 Pro Case Magsafe', sold: 156, revenue: 7800000, margin: 28 },
                { name: 'Charger USB-C 20W', sold: 124, revenue: 4900000, margin: 35 },
                { name: 'TWS Earbuds Bluetooth 5.3', sold: 98, revenue: 6800000, margin: 42 }
            ]
        });
    } catch (error) {
        res.status(500).json({ error: 'Terjadi kesalahan' });
    }
});

module.exports = router;
