const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * Schema untuk User: Termasuk balance, bank info, dan settings admin (% kemenangan).
 */
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, required: true },
  bankName: { type: String, required: true },
  bankNum: { type: String, required: true },
  bankType: { type: String, enum: ['BCA', 'BNI', 'BRI', 'Mandiri', 'DANA', 'OVO', 'GOPAY', 'LinkAja'], required: true },
  balance: { type: Number, default: 0, min: 0 },
  winPercentage: { type: Number, default: 50, min: 0, max: 100 }, // Admin-set
  multiplier: { type: Number, default: 2, min: 1, max: 10 }, // Admin-set
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

/**
 * Hash password sebelum save.
 */
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

/**
 * Method untuk compare password.
 */
userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

/**
 * Method untuk JSON response (exclude password).
 */
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);
