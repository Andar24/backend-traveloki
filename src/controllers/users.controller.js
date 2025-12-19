// src/controllers/users.controller.js
const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Helper untuk membuat Token JWT
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'rahasia-negara', {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

exports.register = async (req, res) => {
  try {
    const { email, username, password, full_name } = req.body;

    // 1. Cek apakah user sudah ada (validasi sederhana)
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ status: 'error', message: 'Email sudah terdaftar' });
    }

    // 2. Buat user baru (Password di-hash otomatis di Model User)
    const newUser = await User.create({ email, username, password, full_name });

    // 3. Buat Token
    const token = signToken(newUser.id);

    // 4. Kirim respon sukses
    res.status(201).json({
      status: 'success',
      message: 'Registrasi berhasil',
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          username: newUser.username,
          role: newUser.role
        },
        token
      }
    });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validasi input
    if (!email || !password) {
      return res.status(400).json({ status: 'error', message: 'Email dan password wajib diisi' });
    }

    // 2. Cari user berdasarkan email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ status: 'error', message: 'Email atau password salah' });
    }

    // 3. Cek Password (Bandingkan input dengan hash di DB)
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ status: 'error', message: 'Email atau password salah' });
    }

    // 4. Jika cocok, buat token
    const token = signToken(user.id);

    // 5. Kirim respon sukses
    res.json({
      status: 'success',
      message: 'Login berhasil',
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          avatar_url: user.avatar_url
        },
        token
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    // req.user diset oleh middleware 'authenticate'
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User tidak ditemukan' });
    }

    // Jangan kirim password hash ke frontend
    delete user.password_hash;

    res.json({
      status: 'success',
      data: user
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// ... Fungsi CRUD Admin (getAllUsers, dll) biarkan seperti mock atau implementasi nanti
// Untuk sekarang, Register dan Login adalah kunci utama.

exports.updateProfile = async (req, res) => { res.json({ message: "Not implemented yet" }) };
exports.getAllUsers = async (req, res) => { res.json({ message: "Not implemented yet" }) };
exports.getUserById = async (req, res) => { res.json({ message: "Not implemented yet" }) };
exports.updateUser = async (req, res) => { res.json({ message: "Not implemented yet" }) };
exports.deleteUser = async (req, res) => { res.json({ message: "Not implemented yet" }) };