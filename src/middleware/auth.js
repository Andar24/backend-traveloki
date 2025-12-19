// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/user.model'); // Import Model User

exports.authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ status: 'error', message: 'Akses ditolak. Token tidak ditemukan.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'rahasia-negara');
    
    // Cari user di database agar role-nya akurat
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ status: 'error', message: 'User tidak ditemukan.' });
    }

    req.user = user; // Simpan data user lengkap di request
    next();
  } catch (error) {
    return res.status(401).json({ status: 'error', message: 'Token tidak valid.' });
  }
};

exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ status: 'error', message: 'Hanya Admin yang boleh akses ini!' });
  }
};

exports.isAdminOrOwner = (req, res, next) => { next(); };