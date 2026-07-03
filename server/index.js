require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const session = require('express-session');
 
const authRoutes    = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes   = require('./routes/orders');
const adminRoutes   = require('./routes/admin');
 
const app = express();
const PORT = process.env.PORT || 4000;
const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
 
const corsOptions = {
  origin: allowedOrigins.length ? allowedOrigins : true,
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type']
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  }
  next();
});
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev_secret_change_me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7,
    sameSite: 'lax',
    secure: false
  }
}));
 
app.use('/api/auth',   authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin',  adminRoutes);
app.use('/api',        productRoutes);
app.get('/api/health', (req, res) => res.json({ ok: true }));
app.get('/api/debug/session', (req, res) => {
  res.json({
    success: true,
    sessionId: req.sessionID,
    customerId: req.session.customerId || null,
    session: req.session
  });
});
 
app.use(express.static(path.join(__dirname, '..')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '..', 'index.html')));
 
app.listen(PORT, () => {
  console.log(`ShopEase API running on http://localhost:${PORT}`);
});
 