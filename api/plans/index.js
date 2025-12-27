/**
 * Plans API - Get subscription plans
 * GET /api/plans - Get all available plans
 */

import { query } from '../../lib/db.js';

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
        const plans = await query(
            'SELECT * FROM plans ORDER BY price ASC'
        );

        // Parse features JSON
        const parsedPlans = plans.map(plan => ({
            ...plan,
            features: JSON.parse(plan.features || '[]')
        }));

        return res.status(200).json(parsedPlans);

    } catch (error) {
        console.error('Plans API error:', error);
        return res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
}
