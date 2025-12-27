/**
 * Auth API - Register
 * POST /api/auth/register
 */

import { v4 as uuidv4 } from 'uuid';
import { query, queryOne, execute } from '../../lib/db.js';
import { hashPassword, generateToken } from '../../lib/auth.js';

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email, password, name, phone } = req.body;

        // Validate input
        if (!email || !password || !name) {
            return res.status(400).json({
                error: 'Email, password, dan nama wajib diisi'
            });
        }

        // Check if email exists
        const existing = await queryOne(
            'SELECT id FROM users WHERE email = ?',
            [email.toLowerCase()]
        );

        if (existing) {
            return res.status(400).json({
                error: 'Email sudah terdaftar'
            });
        }

        // Create user
        const userId = uuidv4();
        const passwordHash = hashPassword(password);

        await execute(
            `INSERT INTO users (id, email, password_hash, name, phone, plan) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, email.toLowerCase(), passwordHash, name, phone || null, 'free']
        );

        // Get created user
        const user = await queryOne(
            'SELECT id, email, name, phone, plan, created_at FROM users WHERE id = ?',
            [userId]
        );

        // Generate token
        const token = generateToken(user);

        return res.status(201).json({
            message: 'Registrasi berhasil!',
            token,
            user
        });

    } catch (error) {
        console.error('Register error:', error);
        return res.status(500).json({
            error: 'Terjadi kesalahan server'
        });
    }
}
