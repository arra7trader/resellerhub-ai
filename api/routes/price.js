/**
 * Price Intelligence Routes
 */
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('./auth');
const { priceAlerts } = require('../db/database');

// Get price alerts
router.get('/alerts', authMiddleware, (req, res) => {
    try {
        const alerts = priceAlerts.findByUserId(req.user.id);

        // Return mock data if no alerts
        if (alerts.length === 0) {
            return res.json({
                alerts: [
                    { id: '1', alert_type: 'price_drop', title: 'iPhone 15 Case - Harga Turun', message: 'Kompetitor turunkan harga 15%', created_at: new Date().toISOString(), read: 0 },
                    { id: '2', alert_type: 'demand_up', title: 'Charger 20W - Demand Naik', message: 'Pencarian naik 45% dalam 7 hari', created_at: new Date().toISOString(), read: 0 },
                    { id: '3', alert_type: 'best_price', title: 'Earbuds TWS - Best Price', message: 'Harga kamu paling kompetitif', created_at: new Date().toISOString(), read: 1 }
                ],
                unreadCount: 2
            });
        }

        res.json({ alerts, unreadCount: priceAlerts.countUnread(req.user.id) });
    } catch (error) {
        res.status(500).json({ error: 'Terjadi kesalahan' });
    }
});

// Mark alert as read
router.put('/alerts/:id/read', authMiddleware, (req, res) => {
    try {
        priceAlerts.markRead(req.params.id);
        res.json({ message: 'Alert ditandai sudah dibaca' });
    } catch (error) {
        res.status(500).json({ error: 'Terjadi kesalahan' });
    }
});

// Get competitor prices for a product
router.get('/competitors/:productId', authMiddleware, (req, res) => {
    try {
        // Mock competitor data
        res.json({
            competitors: [
                { name: 'Toko ABC', platform: 'Shopee', price: 45000, url: '#' },
                { name: 'Seller XYZ', platform: 'Tokopedia', price: 48000, url: '#' },
                { name: 'Store123', platform: 'TikTok Shop', price: 42000, url: '#' }
            ],
            yourPrice: 46000,
            avgPrice: 45000,
            lowestPrice: 42000,
            recommendation: 'Harga kamu kompetitif, tapi bisa turun 5% untuk jadi TOP 3'
        });
    } catch (error) {
        res.status(500).json({ error: 'Terjadi kesalahan' });
    }
});

module.exports = router;
