const jwt = require('jsonwebtoken');
require('dotenv').config();

// Middleware: אימות JWT
function requireAuth(req, res, next) {
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ message: 'Token format is "Bearer <token>"' });
  }

  const token = parts[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // מכיל id, username, role
    next();
  } catch (err) {
    console.error('Token verification error:', err.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
}

// Middleware: בדיקת הרשאה למנהל
function requireAdmin(req, res, next) {
  console.log('🔒 requireAdmin - req.user:', req.user);
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'גישה נדחתה – מנהלים בלבד' });
  }
  next();
}
function requireSellerOrHigher(req, res, next) {
  const role = req.user?.role;
  if (role === 'admin' || role === 'user' || role === 'seller') {
    return next();
  }
  return res.status(403).json({ message: 'גישה נדחתה – מוכר ומעלה בלבד' });
}

function requireUserOrAdmin(req, res, next) {
  const role = req.user?.role;
  if (role === 'admin' || role === 'user') {
    return next();
  }
  return res.status(403).json({ message: 'גישה נדחתה – משתמש או מנהל בלבד' });
}

module.exports = {
  requireAuth,
  requireSellerOrHigher,
  requireUserOrAdmin,
  requireAdmin
};
