/**
 * Payment API - Create Payment Request
 * POST /api/payment/create - Create bank transfer payment
 */

import { v4 as uuidv4 } from 'uuid';
import { queryOne, execute } from '../../lib/db.js';
import { verifyToken, extractToken } from '../../lib/auth.js';

// Bank account info from environment
const BANK_INFO = {
    bank: process.env.BANK_NAME || 'BCA',
    number: process.env.BANK_ACCOUNT_NUMBER || '1234567890',
    name: process.env.BANK_ACCOUNT_NAME || 'ResellerHub'
};

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
        const { plan_id } = req.body;

        if (!plan_id) {
            return res.status(400).json({ error: 'Plan ID required' });
        }

        // Get plan info
        const plan = await queryOne(
            'SELECT * FROM plans WHERE id = ?',
            [plan_id]
        );

        if (!plan) {
            return res.status(404).json({ error: 'Plan tidak ditemukan' });
        }

        // Create unique payment code (last 3 digits)
        const uniqueCode = Math.floor(Math.random() * 900) + 100;
        const totalAmount = plan.price + uniqueCode;

        // Create payment record
        const paymentId = uuidv4();

        await execute(
            `INSERT INTO payments (id, user_id, plan_id, amount, bank_name, status)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [paymentId, decoded.id, plan_id, totalAmount, BANK_INFO.bank, 'pending']
        );

        return res.status(201).json({
            message: 'Pembayaran berhasil dibuat',
            payment: {
                id: paymentId,
                plan: plan.name,
                amount: totalAmount,
                unique_code: uniqueCode
            },
            bank: BANK_INFO,
            instructions: [
                `Transfer tepat Rp ${totalAmount.toLocaleString('id-ID')} ke rekening di atas`,
                'Pastikan nominal transfer SAMA PERSIS termasuk 3 digit unik',
                'Upload bukti transfer setelah pembayaran',
                'Pembayaran akan diverifikasi dalam 1x24 jam'
            ]
        });

    } catch (error) {
        console.error('Payment create error:', error);
        return res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
}
