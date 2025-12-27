/**
 * Auth utilities - JWT and password hashing
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-me';
const JWT_EXPIRES = '7d';

/**
 * Hash password
 */
export function hashPassword(password) {
    return bcrypt.hashSync(password, 10);
}

/**
 * Verify password
 */
export function verifyPassword(password, hash) {
    return bcrypt.compareSync(password, hash);
}

/**
 * Generate JWT token
 */
export function generateToken(user) {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            plan: user.plan
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES }
    );
}

/**
 * Verify JWT token
 */
export function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

/**
 * Extract token from Authorization header
 */
export function extractToken(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.substring(7);
}

/**
 * Auth middleware for API routes
 */
export function withAuth(handler) {
    return async (req, res) => {
        const token = extractToken(req.headers.authorization);
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized - No token provided' });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(401).json({ error: 'Unauthorized - Invalid token' });
        }

        req.user = decoded;
        return handler(req, res);
    };
}

export default { hashPassword, verifyPassword, generateToken, verifyToken, extractToken, withAuth };
