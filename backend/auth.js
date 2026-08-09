import crypto from 'crypto';
import db from './db.js';

// Global active sessions map (token -> user details)
const SESSIONS = new Map();

export function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function loginUser(username, password) {
  const user = db.findOne('users', { username: username.toLowerCase().trim() });
  if (!user) return null;

  const hashed = hashPassword(password);
  if (user.password !== hashed) return null;

  // Generate a random secure session token
  const token = crypto.randomBytes(32).toString('hex');
  const sessionData = {
    userId: user.id,
    username: user.username,
    name: user.name,
    role: user.role
  };
  SESSIONS.set(token, sessionData);

  return { token, user: sessionData };
}

export function logoutUser(token) {
  return SESSIONS.delete(token);
}

// Authentication middleware for Express
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];
  const session = SESSIONS.get(token);
  if (!session) {
    req.user = null;
    return next();
  }

  req.user = session;
  next();
}

// Helper middleware to enforce specific roles
export function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'అనధికారిక ప్రవేశం (Unauthorized)' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'ఈ చర్యకు మీకు అనుమతి లేదు (Forbidden)' });
    }
    next();
  };
}
