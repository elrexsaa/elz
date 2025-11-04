const express = require('express');
const { auth } = require('../middleware/auth');
const Joi = require('joi');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const router = express.Router();

/**
 * Joi schemas untuk transaksi.
 */
const depositSchema = Joi.object({
  amount: Joi.number().min(5000).max(100000000).required().messages({ 'number.min': 'Minimal deposit Rp 5.000' }),
  method: Joi.string().valid('BCA', 'BNI', 'BRI', 'Mandiri', 'DANA', 'OVO', 'GOPAY', 'LinkAja').required(),
  note: Joi.string().allow('').max(500).messages({ 'string.max': 'Catatan maksimal 500 karakter' })
});

const withdrawSchema = Joi.object({
  amount: Joi.number().min(10000).max(100000000).required().messages({ 'number.min': 'Minimal withdraw Rp 10.000' }),
  method: Joi.string().valid('BCA', 'BNI', 'BRI', 'Mandiri', 'DANA', 'OVO', 'GOPAY', 'LinkAja').required(),
  note: Joi.string().allow('').max(500)
});

/**
 * Get user profile (protected).
 */
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ msg: 'Server error.' });
  }
});

/**
 * Create deposit request.
 */
router.post('/deposit', auth, async (req, res) => {
  const { error } = depositSchema.validate(req.body);
  if (error) return res.status(400).json({ msg: 'Validasi gagal', details: error.details[0].message });

  try {
    const { amount, method, note } = req.body;
    const trans = new Transaction({ userId: req.user.id, type: 'deposit', amount, method, note });
    await trans.save();

    // Emit realtime update (optional)
    req.io.to(req.user.id.toString()).emit('depositPending', { amount, status: 'pending' });

    res.json({ msg: 'Request deposit berhasil dikirim. Tunggu approval admin.' });
  } catch (err) {
    console.error('Deposit error:', err);
    res.status(500).json({ msg: 'Server error.' });
  }
});

/**
 * Create withdraw request.
 */
router.post('/withdraw', auth, async (req, res) => {
  const { error } = withdrawSchema.validate(req.body);
  if (error) return res.status(400).json({ msg: 'Validasi gagal', details: error.details[0].message });

  try {
    const { amount, method, note } = req.body;
    if (req.user.balance < amount) return res.status(400).json({ msg: 'Saldo tidak cukup untuk withdraw.' });

    const trans = new Transaction({ userId: req.user.id, type: 'withdraw', amount, method, note });
    await trans.save();

    // Emit realtime
    req.io.to(req.user.id.toString()).emit('withdrawPending', { amount, status: 'pending' });

    res.json({ msg: 'Request withdraw berhasil dikirim. Tunggu approval admin.' });
  } catch (err) {
    console.error('Withdraw error:', err);
    res.status(500).json({ msg: 'Server error.' });
  }
});

module.exports = router;
