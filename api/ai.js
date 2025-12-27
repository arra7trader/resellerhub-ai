/**
 * AI API - Groq integration
 * POST /api/ai - AI suggestions
 */

import Groq from 'groq-sdk';
import { verifyToken, extractToken } from '../lib/auth.js';

let groqClient = null;
function getGroq() {
    if (!groqClient) groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
    return groqClient;
}

async function chat(prompt, systemPrompt = null) {
    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: prompt });

    const response = await getGroq().chat.completions.create({
        model: 'llama-3.1-70b-versatile',
        messages, max_tokens: 1024, temperature: 0.7
    });
    return response.choices[0]?.message?.content || '';
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const token = extractToken(req.headers.authorization);
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const decoded = verifyToken(token);
    if (!decoded) return res.status(401).json({ error: 'Invalid token' });

    try {
        const { action, data } = req.body;
        let result;

        switch (action) {
            case 'price':
                result = await chat(
                    `Produk: ${data.product?.name}\nHarga Modal: Rp ${data.product?.cost_price}\nHarga Jual: Rp ${data.product?.sell_price}\n\nBerikan saran harga optimal dalam JSON: {"suggested_price": number, "reason": "string", "tips": ["string"]}`,
                    'Kamu adalah AI untuk bisnis reseller Indonesia. Jawab dalam Bahasa Indonesia.'
                );
                break;
            case 'description':
                result = await chat(
                    `Buat deskripsi produk marketplace untuk: ${data.product?.name}\nKategori: ${data.product?.category}\n\nBuat dengan emoji, bullet points, dan call-to-action.`,
                    'Kamu adalah copywriter marketplace Indonesia (Shopee, Tokopedia).'
                );
                break;
            case 'tips':
                result = await chat(
                    `Berikan 3 tips bisnis untuk reseller dengan ${data.context?.totalProducts || 0} produk.`,
                    'Kamu adalah mentor bisnis reseller Indonesia.'
                );
                break;
            case 'chat':
                result = await chat(data.message, 'Kamu adalah AI assistant untuk reseller Indonesia.');
                break;
            default:
                return res.status(400).json({ error: 'Unknown action' });
        }

        return res.status(200).json({ action, result });
    } catch (error) {
        console.error('AI error:', error);
        return res.status(500).json({ error: 'AI service error' });
    }
}
