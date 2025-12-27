/**
 * Auth API - Login
 * POST /api/auth/login
 */

import { queryOne } from '../../lib/db.js';
import { verifyPassword, generateToken } from '../../lib/auth.js';

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
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                error: 'Email dan password wajib diisi'
            });
        }

        // Find user
        const user = await queryOne(
            `SELECT id, email, password_hash, name, phone, plan, plan_expires_at, created_at 
             FROM users WHERE email = ?`,
            [email.toLowerCase()]
        );

        if (!user) {
            return res.status(401).json({
                error: 'Email atau password salah'
            });
        }

        // Verify password
        const isValid = verifyPassword(password, user.password_hash);
        if (!isValid) {
            return res.status(401).json({
                error: 'Email atau password salah'
            });
        }

        // Generate token
        const token = generateToken(user);

        // Remove password_hash from response
        delete user.password_hash;

        return res.status(200).json({
            message: 'Login berhasil!',
            token,
            user
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            error: 'Terjadi kesalahan server'
        });
    }
}
