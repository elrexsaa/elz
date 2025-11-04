const mongoose = require('mongoose');

/**
 * Schema untuk rekening bank deposit (admin manage).
 */
const bankSchema = new mongoose.Schema({
  name: { type: String, required: true, enum: ['BCA', 'BNI', 'BRI', 'Mandiri', 'DANA', 'OVO', 'GOPAY', 'LinkAja'] },
  accountName: { type: String, required: true },
  accountNum: { type: String, required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Bank', bankSchema);
