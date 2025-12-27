/**
 * Payment & Plans API
 * GET /api/payment?action=plans - Get plans
 * POST /api/payment?action=create - Create payment
 * POST /api/payment?action=confirm - Confirm payment
 */

import { v4 as uuidv4 } from 'uuid';
import { query, queryOne, execute } from './_lib/db.js';
import { verifyToken, extractToken } from './_lib/auth.js';

const BANK_INFO = {
    bank: process.env.BANK_NAME || 'BCA',
    number: process.env.BANK_ACCOUNT_NUMBER || '1234567890',
    name: process.env.BANK_ACCOUNT_NAME || 'ResellerHub'
};

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const action = req.query.action || req.body?.action;

    try {
        if (action === 'plans') {
            const plans = await query('SELECT * FROM plans ORDER BY price ASC');
            return res.status(200).json(plans.map(p => ({ ...p, features: JSON.parse(p.features || '[]') })));
        }

        // Auth required for other actions
        const token = extractToken(req.headers.authorization);
        if (!token) return res.status(401).json({ error: 'Unauthorized' });
        const decoded = verifyToken(token);
        if (!decoded) return res.status(401).json({ error: 'Invalid token' });

        if (action === 'create') {
            const { plan_id } = req.body;
            const plan = await queryOne('SELECT * FROM plans WHERE id = ?', [plan_id]);
            if (!plan) return res.status(404).json({ error: 'Plan tidak ditemukan' });

            const uniqueCode = Math.floor(Math.random() * 900) + 100;
            const totalAmount = plan.price + uniqueCode;
            const paymentId = uuidv4();

            await execute(
                `INSERT INTO payments (id, user_id, plan_id, amount, bank_name, status) VALUES (?, ?, ?, ?, ?, ?)`,
                [paymentId, decoded.id, plan_id, totalAmount, BANK_INFO.bank, 'pending']
            );

            return res.status(201).json({
                message: 'Pembayaran dibuat', payment: { id: paymentId, plan: plan.name, amount: totalAmount, unique_code: uniqueCode },
                bank: BANK_INFO, instructions: ['Transfer tepat sesuai nominal', 'Upload bukti transfer', 'Verifikasi 1x24 jam']
            });
        }

        if (action === 'confirm') {
            const { payment_id, proof_url } = req.body;
            const payment = await queryOne('SELECT * FROM payments WHERE id = ?', [payment_id]);
            if (!payment) return res.status(404).json({ error: 'Payment tidak ditemukan' });

            await execute(`UPDATE payments SET proof_url = ?, status = 'waiting_confirmation' WHERE id = ?`, [proof_url || '', payment_id]);
            return res.status(200).json({ message: 'Bukti transfer diupload', status: 'waiting_confirmation' });
        }

        if (action === 'my_payments') {
            const payments = await query(
                `SELECT p.*, pl.name as plan_name FROM payments p JOIN plans pl ON p.plan_id = pl.id WHERE p.user_id = ? ORDER BY p.created_at DESC`,
                [decoded.id]
            );
            return res.status(200).json(payments);
        }

        return res.status(400).json({ error: 'Invalid action' });
    } catch (error) {
        console.error('Payment error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
}
