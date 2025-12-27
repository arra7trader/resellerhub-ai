/**
 * AI API - AI-powered features using Groq
 * POST /api/ai/suggest - Get AI suggestions
 */

import { suggestPrice, generateDescription, getBusinessTips, analyzeTrends, chat } from '../../lib/groq.js';
import { verifyToken, extractToken } from '../../lib/auth.js';

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
        const { action, data } = req.body;

        if (!action) {
            return res.status(400).json({ error: 'Action is required' });
        }

        let result;

        switch (action) {
            case 'price':
                // Suggest optimal price
                if (!data?.product) {
                    return res.status(400).json({ error: 'Product data required' });
                }
                result = await suggestPrice(data.product, data.competitorPrices || []);
                break;

            case 'description':
                // Generate product description
                if (!data?.product) {
                    return res.status(400).json({ error: 'Product data required' });
                }
                result = await generateDescription(data.product);
                break;

            case 'tips':
                // Get business tips
                result = await getBusinessTips(data?.context || {});
                break;

            case 'trends':
                // Analyze trends
                result = await analyzeTrends(data?.products || []);
                break;

            case 'chat':
                // General AI chat
                if (!data?.message) {
                    return res.status(400).json({ error: 'Message required' });
                }
                result = await chat(
                    data.message,
                    'Kamu adalah AI assistant untuk reseller Indonesia. Jawab dengan helpful dan dalam Bahasa Indonesia.'
                );
                break;

            default:
                return res.status(400).json({ error: 'Unknown action' });
        }

        return res.status(200).json({
            action,
            result
        });

    } catch (error) {
        console.error('AI API error:', error);
        return res.status(500).json({
            error: 'AI service error',
            message: error.message
        });
    }
}
