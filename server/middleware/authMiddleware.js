const jwt = require('jsonwebtoken');
require('dotenv').config();

// Middleware: אימות JWT
function requireAuth(req, res, next) {
  console.log('🔐 requireAuth - headers:', req.headers);
  console.log('🔐 requireAuth - authorization header:', req.header('Authorization'));
  
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    console.log('❌ No authorization header found');
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    console.log('❌ Invalid token format');
    return res.status(401).json({ message: 'Token format is "Bearer <token>"' });
  }

  const token = parts[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // מכיל id, username, role
    console.log('✅ Token verified successfully, user:', req.user);
    next();
  } catch (err) {
    console.error('❌ Token verification error:', err.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
}

// Middleware: בדיקת הרשאה למנהל
function requireAdmin(req, res, next) {
  console.log('🔒 requireAdmin - req.user:', req.user);
  console.log('🔒 requireAdmin - user role:', req.user?.role);
  console.log('🔒 requireAdmin - method:', req.method);
  console.log('🔒 requireAdmin - path:', req.path);
  
  if (!req.user || req.user.role !== 'admin') {
    console.log('❌ Access denied - user role is not admin');
    return res.status(403).json({ message: 'גישה נדחתה – מנהלים בלבד' });
  }
  console.log('✅ Admin access granted');
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
