const mongoose = require('mongoose');

/**
 * Schema untuk transaksi deposit/withdraw, dengan status workflow.
 */
const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['deposit', 'withdraw'], required: true },
  amount: { type: Number, required: true, min: 0 },
  method: { type: String, required: true, enum: ['BCA', 'BNI', 'BRI', 'Mandiri', 'DANA', 'OVO', 'GOPAY', 'LinkAja'] },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  note: { type: String, maxlength: 500 }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
