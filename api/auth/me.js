/**
 * Auth API - Get Current User
 * GET /api/auth/me
 */

import { queryOne } from '../../lib/db.js';
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

    try {
        // Verify token
        const token = extractToken(req.headers.authorization);
        if (!token) {
            return res.status(401).json({ error: 'Token tidak ditemukan' });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(401).json({ error: 'Token tidak valid' });
        }

        // Get user
        const user = await queryOne(
            `SELECT id, email, name, phone, plan, plan_expires_at, created_at 
             FROM users WHERE id = ?`,
            [decoded.id]
        );

        if (!user) {
            return res.status(404).json({ error: 'User tidak ditemukan' });
        }

        return res.status(200).json(user);

    } catch (error) {
        console.error('Get user error:', error);
        return res.status(500).json({
            error: 'Terjadi kesalahan server'
        });
    }
}
