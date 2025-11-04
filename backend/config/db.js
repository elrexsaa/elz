const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

/**
 * Koneksi ke MongoDB dengan retry logic untuk robustness.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error('Database connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
