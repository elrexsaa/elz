const express = require('express');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { auth, adminAuth } = require('../middleware/auth');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Bank = require('../models/Bank');
const router = express.Router();

/**
 * Joi for user update.
 */
const userUpdateSchema = Joi.object({
  winPercentage: Joi.number().min(0).max(100).required(),
  multiplier: Joi.number().min(1).max(10).required()
});

/**
 * Admin login (simple, ganti dengan JWT full di prod).
 */
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (username !== process.env.ADMIN_USERNAME || password !== process.env.ADMIN_PASSWORD) {
    return res.status(400).json({ msg: 'Invalid admin credentials.' });
  }
  const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.json({ msg: 'Admin login berhasil!', token });
});

/**
 * Get realtime stats.
 */
router.get('/stats', auth, adminAuth, async (req, res) => {
  try {
    const activeUsers = await User.countDocuments({ isActive: true });
    const totalUsers = await User.countDocuments();
    const totalBalance = await User.aggregate([{ $group: { _id: null, total: { $sum: '$balance' } } }]);
    const totalWithdraw = await Transaction.aggregate([
      { $match: { type: 'withdraw', status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    res.json({
      activeUsers,
      totalUsers,
      totalBalance: totalBalance[0]?.total || 0,
      totalWithdraw: totalWithdraw[0]?.total || 0
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ msg: 'Server error.' });
  }
});

/**
 * Get all users.
 */
router.get('/users', auth, adminAuth, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error('Users error:', err);
    res.status(500).json({ msg: 'Server error.' });
  }
});

/**
 * Update user settings (win % & multiplier).
 */
router.put('/users/:id', auth, adminAuth, async (req, res) => {
  const { error } = userUpdateSchema.validate(req.body);
  if (error) return res.status(400).json({ msg: 'Validasi gagal', details: error.details[0].message });

  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
    if (!user) return res.status(404).json({ msg: 'User tidak ditemukan.' });
    res.json({ msg: 'User updated!', user });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ msg: 'Server error.' });
  }
});

/**
 * Get all banks.
 */
router.get('/banks', auth, adminAuth, async (req, res) => {
  try {
    const banks = await Bank.find({ isActive: true }).sort({ name: 1 });
    res.json(banks);
  } catch (err) {
    console.error('Banks error:', err);
    res.status(500).json({ msg: 'Server error.' });
  }
});

/**
 * Add/edit bank.
 */
router.post('/banks', auth, adminAuth, async (req, res) => {
  try {
    const bank = new Bank(req.body);
    await bank.save();
    res.status(201).json({ msg: 'Bank added!', bank });
  } catch (err) {
    console.error('Bank error:', err);
    res.status(500).json({ msg: 'Server error.' });
  }
});

/**
 * Get all requests.
 */
router.get('/requests', auth, adminAuth, async (req, res) => {
  try {
    const requests = await Transaction.find({ status: 'pending' }).populate('userId', 'username balance').sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    console.error('Requests error:', err);
    res.status(500).json({ msg: 'Server error.' });
  }
});

/**
 * Approve request (update balance realtime).
 */
router.put('/requests/:id/approve', auth, adminAuth, async (req, res) => {
  try {
    const trans = await Transaction.findByIdAndUpdate(req.params.id, { status: 'approved' }, { new: true }).populate('userId');
    if (!trans) return res.status(404).json({ msg: 'Request tidak ditemukan.' });

    if (trans.type === 'deposit') {
      await User.findByIdAndUpdate(trans.userId._id, { $inc: { balance: trans.amount } });
      // Emit realtime to user
      req.io.to(trans.userId._id.toString()).emit('balanceUpdated', trans.userId.balance + trans.amount);
    }

    res.json({ msg: 'Request approved!', trans });
  } catch (err) {
    console.error('Approve error:', err);
    res.status(500).json({ msg: 'Server error.' });
  }
});

module.exports = router;
