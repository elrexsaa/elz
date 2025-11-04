const express = require('express');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const User = require('../models/User');
const sendTelegramNotif = require('../utils/telegram');
const router = express.Router();

/**
 * Joi schemas untuk validasi input (profesional & strict).
 */
const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required().messages({ 'string.alphanum': 'Username hanya huruf dan angka' }),
  password: Joi.string().min(6).required().messages({ 'string.min': 'Password minimal 6 karakter' }),
  email: Joi.string().email().required().messages({ 'string.email': 'Email tidak valid' }),
  phone: Joi.string().pattern(/^\+?62\d{10,12}$/).required().messages({ 'string.pattern.base': 'No HP Indonesia tidak valid' }),
  bankName: Joi.string().min(2).required().messages({ 'string.min': 'Nama rekening minimal 2 karakter' }),
  bankNum: Joi.string().min(10).required().messages({ 'string.min': 'Nomor rekening minimal 10 digit' }),
  bankType: Joi.string().valid('BCA', 'BNI', 'BRI', 'Mandiri', 'DANA', 'OVO', 'GOPAY', 'LinkAja').required().messages({ 'any.only': 'Pilih bank/e-money yang valid' }),
  captchaAnswer: Joi.number().integer().min(0).max(100).required().messages({ 'number.base': 'Jawab CAPTCHA dengan angka' })
});

const loginSchema = Joi.object({
  username: Joi.string().alphanum().min(3).required(),
  password: Joi.string().min(6).required()
});

/**
 * Generate CAPTCHA math question (server-side, session-based).
 */
router.get('/captcha', (req, res) => {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  req.session.captcha = { question: `${a} + ${b} = ?`, answer: a + b };
  res.json({ question: req.session.captcha.question });
});

/**
 * Register new user dengan validasi & Telegram notif.
 */
router.post('/register', async (req, res) => {
  const { error } = registerSchema.validate(req.body);
  if (error) return res.status(400).json({ msg: 'Validasi gagal', details: error.details[0].message });

  try {
    const { username, password, email, phone, bankName, bankNum, bankType, captchaAnswer } = req.body;

    // CAPTCHA verify
    const expected = req.session?.captcha?.answer || 0;
    if (parseInt(captchaAnswer) !== expected) {
      return res.status(400).json({ msg: 'CAPTCHA salah. Coba generate ulang.' });
    }

    // Check duplicate
    let user = await User.findOne({ $or: [{ username }, { email }] });
    if (user) return res.status(400).json({ msg: 'Username atau email sudah terdaftar.' });

    // Create user
    user = new User({ username, password, email, phone, bankName, bankNum, bankType });
    await user.save();

    // Telegram notif
    sendTelegramNotif(`
      <b>🆕 Member Baru Daftar!</b>
      <b>👤 Username:</b> ${username}
      <b>📧 Email:</b> ${email}
      <b>📱 Phone:</b> ${phone}
      <b>💳 Bank:</b> ${bankType} - ${bankNum} (${bankName})
      <i>Daftar pada: ${new Date().toLocaleString('id-ID')}</i>
    `);

    // JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ msg: 'Daftar berhasil!', token, user: user.toJSON() });
  } catch (err) {
    console.error('Register error:', err);
    if (err.code === 11000) return res.status(400).json({ msg: 'Data duplikat ditemukan.' });
    res.status(500).json({ msg: 'Server error. Coba lagi.' });
  }
});

/**
 * Login dengan password compare.
 */
router.post('/login', async (req, res) => {
  const { error } = loginSchema.validate(req.body);
  if (error) return res.status(400).json({ msg: 'Validasi gagal', details: error.details[0].message });

  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ msg: 'Username atau password salah.' });
    }
    if (!user.isActive) return res.status(403).json({ msg: 'Akun Anda tidak aktif. Hubungi CS.' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ msg: 'Login berhasil!', token, user: user.toJSON() });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ msg: 'Server error.' });
  }
});

module.exports = router;
