/**
 * Google OAuth - Callback Handler
 * GET /api/auth/google/callback - Handle Google OAuth callback
 */

import { v4 as uuidv4 } from 'uuid';
import { query, queryOne, execute } from '../../../lib/db.js';
import { generateToken } from '../../../lib/auth.js';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { code, error } = req.query;

    if (error) {
        return res.redirect('/login.html?error=' + encodeURIComponent(error));
    }

    if (!code) {
        return res.redirect('/login.html?error=no_code');
    }

    try {
        // Exchange code for tokens
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: GOOGLE_CLIENT_ID,
                client_secret: GOOGLE_CLIENT_SECRET,
                redirect_uri: REDIRECT_URI,
                grant_type: 'authorization_code'
            })
        });

        const tokens = await tokenResponse.json();

        if (!tokens.access_token) {
            console.error('Token exchange failed:', tokens);
            return res.redirect('/login.html?error=token_failed');
        }

        // Get user info from Google
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokens.access_token}` }
        });

        const googleUser = await userInfoResponse.json();

        if (!googleUser.email) {
            return res.redirect('/login.html?error=no_email');
        }

        // Check if user exists
        let user = await queryOne(
            'SELECT * FROM users WHERE email = ?',
            [googleUser.email.toLowerCase()]
        );

        if (!user) {
            // Create new user
            const userId = uuidv4();
            await execute(
                `INSERT INTO users (id, email, password_hash, name, phone, plan) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    userId,
                    googleUser.email.toLowerCase(),
                    'GOOGLE_OAUTH', // No password for Google users
                    googleUser.name || googleUser.email.split('@')[0],
                    null,
                    'free'
                ]
            );

            user = await queryOne('SELECT * FROM users WHERE id = ?', [userId]);
        }

        // Generate JWT token
        const token = generateToken(user);

        // Redirect to frontend with token
        const redirectUrl = `/dashboard.html?token=${token}&user=${encodeURIComponent(JSON.stringify({
            id: user.id,
            email: user.email,
            name: user.name,
            plan: user.plan
        }))}`;

        res.redirect(302, redirectUrl);

    } catch (error) {
        console.error('Google OAuth error:', error);
        res.redirect('/login.html?error=oauth_failed');
    }
}
