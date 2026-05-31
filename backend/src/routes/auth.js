const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const db = require('../db/database');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// ─── Validation schemas ──────────────────────────────────────
const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username may only contain letters, numbers, and underscores'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be at most 100 characters'),
});

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

// ─── Helpers ─────────────────────────────────────────────────
function generateUID() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let uid;
  do {
    uid = 'TXU-';
    for (let i = 0; i < 6; i++) uid += chars[Math.floor(Math.random() * chars.length)];
  } while (db.prepare('SELECT id FROM users WHERE uid = ?').get(uid));
  return uid;
}

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function safeUser(user) {
  const { password_hash, ...rest } = user;
  return rest;
}

// ─── POST /api/auth/register ─────────────────────────────────
router.post('/register', async (req, res, next) => {
  try {
    const { username, password } = registerSchema.parse(req.body);

    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const uid = generateUID();

    const result = db
      .prepare('INSERT INTO users (uid, username, password_hash) VALUES (?, ?, ?)')
      .run(uid, username, password_hash);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    const token = signToken(user.id);

    res.status(201).json({ token, user: safeUser(user) });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    next(err);
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = loginSchema.parse(req.body);

    const user = db.prepare('SELECT * FROM users WHERE username = ? OR uid = ?').get(username, username);
    // Use constant-time compare to prevent user enumeration
    if (!user) {
      await bcrypt.hash(password, 12); // dummy hash to prevent timing attack
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = signToken(user.id);
    res.json({ token, user: safeUser(user) });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    next(err);
  }
});

// ─── POST /api/auth/logout ────────────────────────────────────
// JWT is stateless; logout is handled client-side by discarding the token.
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// ─── GET /api/auth/me ─────────────────────────────────────────
router.get('/me', verifyToken, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
