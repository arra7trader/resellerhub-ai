/**
 * Database Init API
 * POST /api/init - Initialize database schema
 */

import { initSchema } from '../../lib/db.js';

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        await initSchema();

        return res.status(200).json({
            message: 'Database schema initialized successfully',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Init error:', error);
        return res.status(500).json({
            error: 'Failed to initialize database',
            message: error.message
        });
    }
}
