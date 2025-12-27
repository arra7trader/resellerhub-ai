/**
 * Groq AI Client
 * Fast LLM integration for ResellerHub AI
 */

import Groq from 'groq-sdk';

let groqClient = null;

function getGroq() {
    if (!groqClient) {
        groqClient = new Groq({
            apiKey: process.env.GROQ_API_KEY
        });
    }
    return groqClient;
}

/**
 * Generic AI chat function
 */
export async function chat(prompt, systemPrompt = null) {
    const groq = getGroq();

    const messages = [];
    if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    try {
        const response = await groq.chat.completions.create({
            model: 'llama-3.1-70b-versatile',
            messages,
            max_tokens: 1024,
            temperature: 0.7
        });
        return response.choices[0]?.message?.content || '';
    } catch (error) {
        console.error('Groq AI error:', error);
        throw error;
    }
}

/**
 * Suggest optimal price for a product
 */
export async function suggestPrice(product, competitorPrices = []) {
    const systemPrompt = `Kamu adalah AI assistant untuk bisnis reseller Indonesia. 
Berikan saran harga yang optimal dalam format JSON.
Jawab dalam Bahasa Indonesia.`;

    const prompt = `
Produk: ${product.name}
Harga Modal: Rp ${product.cost_price?.toLocaleString('id-ID')}
Harga Jual Saat Ini: Rp ${product.sell_price?.toLocaleString('id-ID')}
Kategori: ${product.category || 'Umum'}
${competitorPrices.length > 0 ? `Harga Kompetitor: ${competitorPrices.map(p => 'Rp ' + p.toLocaleString('id-ID')).join(', ')}` : ''}

Berikan saran:
1. Harga jual optimal
2. Alasan
3. Tips meningkatkan margin

Format JSON:
{
    "suggested_price": number,
    "min_price": number,
    "max_price": number,
    "reason": "string",
    "tips": ["string"]
}
`;

    const response = await chat(prompt, systemPrompt);
    try {
        // Extract JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
    } catch (e) {
        console.error('Failed to parse price suggestion:', e);
    }
    return { suggested_price: product.sell_price, reason: response };
}

/**
 * Generate product description
 */
export async function generateDescription(product) {
    const systemPrompt = `Kamu adalah copywriter untuk marketplace Indonesia (Shopee, Tokopedia).
Buat deskripsi produk yang menarik dan SEO-friendly.
Gunakan emoji yang relevan.
Bahasa Indonesia yang natural.`;

    const prompt = `
Buat deskripsi produk untuk:
Nama: ${product.name}
Kategori: ${product.category || 'Umum'}
Harga: Rp ${product.sell_price?.toLocaleString('id-ID')}
${product.description ? `Info tambahan: ${product.description}` : ''}

Buat dalam format:
1. Judul menarik (max 60 karakter)
2. Highlight/bullet points (5 poin)
3. Deskripsi lengkap (2-3 paragraf)
4. Call-to-action
`;

    return await chat(prompt, systemPrompt);
}

/**
 * Get business tips for reseller
 */
export async function getBusinessTips(context = {}) {
    const systemPrompt = `Kamu adalah mentor bisnis untuk reseller Indonesia.
Berikan tips praktis dan actionable.
Bahasa Indonesia yang santai tapi profesional.`;

    const prompt = `
Berikan 3 tips bisnis untuk reseller dengan konteks:
- Total produk: ${context.totalProducts || 0}
- Revenue bulan ini: Rp ${(context.monthlyRevenue || 0).toLocaleString('id-ID')}
- Platform aktif: ${context.platforms?.join(', ') || 'Belum ada'}
- Concern utama: ${context.concern || 'Meningkatkan penjualan'}

Format tips yang singkat dan actionable.
`;

    return await chat(prompt, systemPrompt);
}

/**
 * Analyze product trends
 */
export async function analyzeTrends(products = []) {
    const systemPrompt = `Kamu adalah analis pasar e-commerce Indonesia.
Analisis tren dan berikan insight.`;

    const productSummary = products.slice(0, 10).map(p =>
        `${p.name} (${p.category}) - Terjual: ${p.sold || 0}`
    ).join('\n');

    const prompt = `
Berdasarkan data produk berikut:
${productSummary}

Berikan analisis:
1. Kategori yang paling laris
2. Produk yang sebaiknya di-push
3. Rekomendasi produk baru yang bisa ditambahkan
4. Tren pasar saat ini
`;

    return await chat(prompt, systemPrompt);
}

export default { chat, suggestPrice, generateDescription, getBusinessTips, analyzeTrends };
