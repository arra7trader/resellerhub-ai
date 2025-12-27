/**
 * Payment API - Upload Proof & Confirm
 * POST /api/payment/confirm - Admin confirm payment
 */

import { queryOne, execute } from '../../lib/db.js';
import { verifyToken, extractToken } from '../../lib/auth.js';

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
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

    try {
        // GET - Get user's payments
        if (req.method === 'GET') {
            const payments = await queryOne(
                `SELECT p.*, pl.name as plan_name 
                 FROM payments p 
                 JOIN plans pl ON p.plan_id = pl.id 
                 WHERE p.user_id = ? 
                 ORDER BY p.created_at DESC`,
                [decoded.id]
            );
            return res.status(200).json(payments || []);
        }

        // POST - Upload proof or confirm (admin)
        if (req.method === 'POST') {
            const { payment_id, action, proof_url } = req.body;

            if (!payment_id || !action) {
                return res.status(400).json({ error: 'Payment ID and action required' });
            }

            const payment = await queryOne(
                'SELECT * FROM payments WHERE id = ?',
                [payment_id]
            );

            if (!payment) {
                return res.status(404).json({ error: 'Payment tidak ditemukan' });
            }

            if (action === 'upload_proof') {
                // User uploads proof
                if (payment.user_id !== decoded.id) {
                    return res.status(403).json({ error: 'Forbidden' });
                }

                await execute(
                    `UPDATE payments SET proof_url = ?, status = 'waiting_confirmation' WHERE id = ?`,
                    [proof_url || '', payment_id]
                );

                return res.status(200).json({
                    message: 'Bukti transfer berhasil diupload',
                    status: 'waiting_confirmation'
                });
            }

            if (action === 'confirm') {
                // Admin confirms payment
                // TODO: Add admin role check

                // Update payment status
                await execute(
                    `UPDATE payments SET 
                        status = 'confirmed', 
                        confirmed_by = ?, 
                        confirmed_at = CURRENT_TIMESTAMP 
                     WHERE id = ?`,
                    [decoded.id, payment_id]
                );

                // Upgrade user plan
                const plan = await queryOne(
                    'SELECT * FROM plans WHERE id = ?',
                    [payment.plan_id]
                );

                // Set plan expiry to 30 days from now
                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + 30);

                await execute(
                    `UPDATE users SET plan = ?, plan_expires_at = ? WHERE id = ?`,
                    [payment.plan_id, expiresAt.toISOString(), payment.user_id]
                );

                return res.status(200).json({
                    message: 'Pembayaran berhasil dikonfirmasi',
                    plan: plan?.name,
                    expires_at: expiresAt.toISOString()
                });
            }

            if (action === 'reject') {
                // Admin rejects payment
                await execute(
                    `UPDATE payments SET status = 'rejected' WHERE id = ?`,
                    [payment_id]
                );

                return res.status(200).json({
                    message: 'Pembayaran ditolak'
                });
            }

            return res.status(400).json({ error: 'Unknown action' });
        }

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (error) {
        console.error('Payment confirm error:', error);
        return res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
}
