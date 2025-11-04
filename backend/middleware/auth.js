const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware untuk verify JWT token dan attach user ke req.
 */
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ msg: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ msg: 'Invalid token.' });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid.' });
  }
};

/**
 * Middleware khusus admin.
 */
const adminAuth = (req, res, next) => {
  if (req.user.username !== process.env.ADMIN_USERNAME) {
    return res.status(403).json({ msg: 'Access denied. Admin only.' });
  }
  next();
};

module.exports = { auth, adminAuth };
