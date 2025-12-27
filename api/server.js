/**
 * ResellerHub AI - Express Server
 */
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { initDatabase } = require('./db/database');
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001', 'file://'], credentials: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));
app.use((req, res, next) => { console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`); next(); });

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

let routesLoaded = false;

async function loadRoutes() {
    if (routesLoaded) return;
    await initDatabase();

    const authRoutes = require('./routes/auth');
    const productsRoutes = require('./routes/products');
    const analyticsRoutes = require('./routes/analytics');
    const priceRoutes = require('./routes/price');

    app.use('/api/auth', authRoutes);
    app.use('/api/products', productsRoutes);
    app.use('/api/analytics', analyticsRoutes);
    app.use('/api/price', priceRoutes);

    routesLoaded = true;
    console.log('✅ All routes loaded');
}

// 404 handler
app.use((req, res, next) => {
    if (req.path.startsWith('/api/') && !routesLoaded) {
        return res.status(503).json({ error: 'Server starting...' });
    }
    res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

async function startServer() {
    try {
        await loadRoutes();
        app.listen(PORT, () => {
            console.log(`
╔═══════════════════════════════════════════════════╗
║         🚀 ResellerHub AI API Server             ║
╠═══════════════════════════════════════════════════╣
║  Status:  Running                                 ║
║  Port:    ${PORT}                                    ║
║  URL:     http://localhost:${PORT}                   ║
╚═══════════════════════════════════════════════════╝
            `);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
module.exports = app;
