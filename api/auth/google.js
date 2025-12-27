/**
 * Google OAuth - Initiate Login
 * GET /api/auth/google - Redirect to Google login
 */

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const scope = encodeURIComponent('openid email profile');
    const state = Math.random().toString(36).substring(7);

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${GOOGLE_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
        `&response_type=code` +
        `&scope=${scope}` +
        `&state=${state}` +
        `&access_type=offline` +
        `&prompt=consent`;

    // Redirect to Google
    res.redirect(302, authUrl);
}
