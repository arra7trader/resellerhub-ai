/**
 * Auth Routes
 */
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { users, generateId } = require('../db/database');

const JWT_SECRET = process.env.JWT_SECRET || 'resellerhub-secret';

// Auth middleware
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token tidak ditemukan' });
    }
    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token tidak valid' });
    }
}

// Register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Data tidak lengkap' });
        }
        const existing = users.findByEmail(email);
        if (existing) {
            return res.status(400).json({ error: 'Email sudah terdaftar' });
        }
        const password_hash = await bcrypt.hash(password, 10);
        const user = users.create({ name, email, password_hash, phone });
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            message: 'Registrasi berhasil',
            token,
            user: { id: user.id, name: user.name, email: user.email, plan: user.plan }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Terjadi kesalahan' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email dan password harus diisi' });
        }
        const user = users.findByEmail(email);
        if (!user) {
            return res.status(401).json({ error: 'Email atau password salah' });
        }
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Email atau password salah' });
        }
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            message: 'Login berhasil',
            token,
            user: { id: user.id, name: user.name, email: user.email, plan: user.plan }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Terjadi kesalahan' });
    }
});

// Get current user
router.get('/me', authMiddleware, (req, res) => {
    try {
        const user = users.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User tidak ditemukan' });
        }
        res.json({ user: { id: user.id, name: user.name, email: user.email, plan: user.plan } });
    } catch (error) {
        res.status(500).json({ error: 'Terjadi kesalahan' });
    }
});

module.exports = router;
module.exports.authMiddleware = authMiddleware;
