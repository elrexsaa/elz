const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

connectDB();  // Connect DB first

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { 
  cors: { origin: '*', methods: ['GET', 'POST'] } 
});

// Middleware stack (profesional order)
app.use(cors({ origin: process.env.NODE_ENV === 'production' ? 'your-domain.com' : '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(session({ 
  secret: process.env.SESSION_SECRET, 
  resave: false, 
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 24 * 60 * 60 * 1000 }  // 24h
}));
app.use(rateLimit({ 
  windowMs: 15 * 60 * 1000,  // 15 min
  max: 100,  // Limit per IP
  message: { msg: 'Too many requests, try again later.' }
}));

// Attach io to req for realtime in routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);

// Serve frontend static files (MPA support)
app.use(express.static(path.join(__dirname, '../frontend')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Global error handler (catch async errors)
app.use((err, req, res, next) => {
  console.error('Global error:', err.stack);
  res.status(err.status || 500).json({
    msg: err.msg || 'Internal server error.',
    ...(process.env.NODE_ENV === 'development' && { error: err.message, stack: err.stack })
  });
});

// Socket.io realtime (join room per user, balance update)
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room`);
  });

  socket.on('updateBalance', (data) => {
    io.to(data.userId).emit('balanceUpdated', data.balance);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => process.exit(0));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  console.log(`📡 Socket.io ready for realtime updates`);
});
