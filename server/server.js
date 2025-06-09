require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const pool = require('./config/db');
const reportsRoutes = require('./routes/reportsRoutes');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const salesRoutes = require('./routes/salesRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// אבטחה
app.use(helmet());

// הגדרת CORS ברורה ומדויקת
const allowedOrigins = [
  'http://localhost:3000',
  'https://redberry-inventory-client.vercel.app'
];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('❌ Blocked CORS from origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// תמיכה בבקשות OPTIONS (Preflight)
app.options('*', cors());

// הגבלת קצב התחברות
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'יותר מדי ניסיונות – נסה שוב מאוחר יותר'
});
app.use('/api/auth/login', authLimiter);

// בדיקת חיבור למסד נתונים
pool.getConnection()
  .then(conn => {
    console.log('✅ MySQL connected');
    conn.release();
  })
  .catch(err => console.error('❌ DB connection error:', err.message));

// נתיבים
app.get('/', (req, res) => res.send('Furniture Store API Running'));
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportsRoutes);

// טיפול בשגיאות
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ message: 'Something broke!', error: err.message });
});

// הרצת שרת
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
