/**
 * Products Routes
 */
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('./auth');
const { products } = require('../db/database');

// Get all products
router.get('/', authMiddleware, (req, res) => {
    try {
        const productList = products.findByUserId(req.user.id);
        res.json({ products: productList });
    } catch (error) {
        res.status(500).json({ error: 'Terjadi kesalahan' });
    }
});

// Get product by ID
router.get('/:id', authMiddleware, (req, res) => {
    try {
        const product = products.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ error: 'Produk tidak ditemukan' });
        }
        res.json({ product });
    } catch (error) {
        res.status(500).json({ error: 'Terjadi kesalahan' });
    }
});

// Create product
router.post('/', authMiddleware, (req, res) => {
    try {
        const { name, description, sku, cost_price, sell_price, stock, category } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Nama produk harus diisi' });
        }
        const product = products.create({
            user_id: req.user.id, name, description, sku, cost_price, sell_price, stock, category
        });
        res.status(201).json({ message: 'Produk berhasil ditambahkan', product });
    } catch (error) {
        res.status(500).json({ error: 'Terjadi kesalahan' });
    }
});

// Update product
router.put('/:id', authMiddleware, (req, res) => {
    try {
        const existing = products.findById(req.params.id);
        if (!existing) {
            return res.status(404).json({ error: 'Produk tidak ditemukan' });
        }
        const updated = products.update(req.params.id, req.body);
        res.json({ message: 'Produk berhasil diupdate', product: updated });
    } catch (error) {
        res.status(500).json({ error: 'Terjadi kesalahan' });
    }
});

// Delete product
router.delete('/:id', authMiddleware, (req, res) => {
    try {
        products.delete(req.params.id);
        res.json({ message: 'Produk berhasil dihapus' });
    } catch (error) {
        res.status(500).json({ error: 'Terjadi kesalahan' });
    }
});

module.exports = router;
