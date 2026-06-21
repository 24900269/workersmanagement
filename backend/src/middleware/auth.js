const jwt = require('jsonwebtoken');
const db = require('../db/database');

/**
 * Middleware: verify JWT and attach req.user.
 * Rejects with 401 if token is missing, invalid, or user no longer exists.
 */
function verifyToken(req, res, next) {
  const auth = req.headers.authorization;
  
  if (!auth) {
    console.warn(`[AUTH-AUDIT] Token verification failed: Missing Authorization header from IP: ${req.ip}`);
    return res.status(401).json({ error: 'Authentication required' });
  }

  const parts = auth.trim().split(/\s+/);
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    console.warn(`[AUTH-AUDIT] Token verification failed: Malformed Authorization header ("${auth}") from IP: ${req.ip}`);
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = parts[1];
  const shortToken = token.length > 20 ? `${token.substring(0, 10)}...${token.substring(token.length - 10)}` : 'short-token';
  
  try {
    // Print verification attempt
    console.log(`[AUTH-AUDIT] Verifying token: "${shortToken}" (JWT_SECRET length: ${process.env.JWT_SECRET?.length || 0})`);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log(`[AUTH-AUDIT] Token signature verified successfully. Decoded User ID: ${decoded.id}`);

    // Confirm user still exists in DB
    const user = db
      .prepare('SELECT id, uid, username, is_admin FROM users WHERE id = ?')
      .get(decoded.id);

    if (!user) {
      console.warn(`[AUTH-AUDIT] Token verified but user ID: ${decoded.id} no longer exists in database. Wiping session...`);
      return res.status(401).json({ error: 'User not found' });
    }

    console.log(`[AUTH-AUDIT] Session active and validated. User: "${user.username}" (ID: ${user.id})`);
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      console.warn(`[AUTH-AUDIT] Token verification failed for "${shortToken}": Expired token. Error: ${err.message}`);
      return res.status(401).json({ error: 'Expired token' });
    }
    console.warn(`[AUTH-AUDIT] Token verification failed for "${shortToken}": Invalid token. Error: ${err.message}`);
    return res.status(401).json({ error: 'Invalid token' });
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
