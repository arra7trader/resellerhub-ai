/**
 * Auth API - All authentication endpoints
 * POST /api/auth?action=register
 * POST /api/auth?action=login
 * GET /api/auth?action=me
 * GET /api/auth?action=google
 */

import { v4 as uuidv4 } from 'uuid';
import { query, queryOne, execute } from './_lib/db.js';
import { hashPassword, verifyPassword, generateToken, verifyToken, extractToken } from './_lib/auth.js';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || '/api/auth?action=google_callback';

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const action = req.query.action || req.body?.action;

    try {
        switch (action) {
            case 'register':
                return await handleRegister(req, res);
            case 'login':
                return await handleLogin(req, res);
            case 'me':
                return await handleMe(req, res);
            case 'google':
                return handleGoogleRedirect(req, res);
            case 'google_callback':
                return await handleGoogleCallback(req, res);
            default:
                return res.status(400).json({ error: 'Invalid action' });
        }
    } catch (error) {
        console.error('Auth error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
}

async function handleRegister(req, res) {
    const { email, password, name, phone } = req.body;

    if (!email || !password || !name) {
        return res.status(400).json({ error: 'Email, password, dan nama wajib diisi' });
    }

    const existing = await queryOne('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (existing) {
        return res.status(400).json({ error: 'Email sudah terdaftar' });
    }

    const userId = uuidv4();
    const passwordHash = hashPassword(password);

    await execute(
        `INSERT INTO users (id, email, password_hash, name, phone, plan) VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, email.toLowerCase(), passwordHash, name, phone || null, 'free']
    );

    const user = await queryOne('SELECT id, email, name, phone, plan, created_at FROM users WHERE id = ?', [userId]);
    const token = generateToken(user);

    return res.status(201).json({ message: 'Registrasi berhasil!', token, user });
}

async function handleLogin(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email dan password wajib diisi' });
    }

    const user = await queryOne(
        'SELECT id, email, password_hash, name, phone, plan, created_at FROM users WHERE email = ?',
        [email.toLowerCase()]
    );

    if (!user || !verifyPassword(password, user.password_hash)) {
        return res.status(401).json({ error: 'Email atau password salah' });
    }

    const token = generateToken(user);
    delete user.password_hash;

    return res.status(200).json({ message: 'Login berhasil!', token, user });
}

async function handleMe(req, res) {
    const token = extractToken(req.headers.authorization);
    if (!token) return res.status(401).json({ error: 'Token tidak ditemukan' });

    const decoded = verifyToken(token);
    if (!decoded) return res.status(401).json({ error: 'Token tidak valid' });

    const user = await queryOne(
        'SELECT id, email, name, phone, plan, plan_expires_at, created_at FROM users WHERE id = ?',
        [decoded.id]
    );

    if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });

    return res.status(200).json(user);
}

function handleGoogleRedirect(req, res) {
    const scope = encodeURIComponent('openid email profile');
    const state = Math.random().toString(36).substring(7);
    const redirectUri = `${req.headers.origin || 'http://localhost:3000'}${GOOGLE_REDIRECT_URI}`;

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${GOOGLE_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code&scope=${scope}&state=${state}&access_type=offline&prompt=consent`;

    return res.redirect(302, authUrl);
}

async function handleGoogleCallback(req, res) {
    const { code, error } = req.query;

    if (error || !code) {
        return res.redirect('/login.html?error=' + (error || 'no_code'));
    }

    const redirectUri = `${req.headers.origin || 'http://localhost:3000'}${GOOGLE_REDIRECT_URI}`;

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            code, client_id: GOOGLE_CLIENT_ID, client_secret: GOOGLE_CLIENT_SECRET,
            redirect_uri: redirectUri, grant_type: 'authorization_code'
        })
    });

    const tokens = await tokenResponse.json();
    if (!tokens.access_token) {
        return res.redirect('/login.html?error=token_failed');
    }

    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
    });
    const googleUser = await userInfoResponse.json();

    if (!googleUser.email) {
        return res.redirect('/login.html?error=no_email');
    }

    let user = await queryOne('SELECT * FROM users WHERE email = ?', [googleUser.email.toLowerCase()]);

    if (!user) {
        const userId = uuidv4();
        await execute(
            `INSERT INTO users (id, email, password_hash, name, plan) VALUES (?, ?, ?, ?, ?)`,
            [userId, googleUser.email.toLowerCase(), 'GOOGLE_OAUTH', googleUser.name || googleUser.email.split('@')[0], 'free']
        );
        user = await queryOne('SELECT * FROM users WHERE id = ?', [userId]);
    }

    const token = generateToken(user);
    const userData = encodeURIComponent(JSON.stringify({ id: user.id, email: user.email, name: user.name, plan: user.plan }));

    return res.redirect(`/dashboard.html?token=${token}&user=${userData}`);
}
