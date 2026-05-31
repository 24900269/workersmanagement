const jwt = require('jsonwebtoken');
const db = require('../db/database');

/**
 * Middleware: verify JWT and attach req.user.
 * Rejects with 401 if token is missing, invalid, or user no longer exists.
 */
function verifyToken(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = auth.slice(7); // remove "Bearer "
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Confirm user still exists in DB
    const user = db
      .prepare('SELECT id, uid, username, is_admin FROM users WHERE id = ?')
      .get(decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Middleware: require the authenticated user to be an admin.
 * Must be used AFTER verifyToken.
 */
function requireAdmin(req, res, next) {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

module.exports = { verifyToken, requireAdmin };
