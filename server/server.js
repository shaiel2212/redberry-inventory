require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./config/db'); // ודא שהחיבור למסד הנתונים תקין
const reportsRoutes = require('./routes/reportsRoutes');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const salesRoutes = require('./routes/salesRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const helmet = require('helmet');
app.use(helmet());
// Middleware
app.use(cors({
  origin: 'https://redberry-inventory.onrender.com/', // החלף ב־Render / Vercel שלך
  credentials: true
}));
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use('/api/users', userRoutes);

// Test DB Connection
pool.getConnection()
  .then(connection => {
    console.log('MySQL Connected...');
    connection.release();
  })
  .catch(err => console.error('Error connecting to MySQL:', err.message));


// Routes
app.get('/', (req, res) => {
  res.send('Furniture Store API Running');
});
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/reports', reportsRoutes);

// Error Handling Middleware (Simple example)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ message: 'Something broke!', error: err.message });
});

const rateLimit = require('express-rate-limit');
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'יותר מדי ניסיונות – נסה שוב מאוחר יותר'
});
app.use('/api/auth/login', authLimiter);
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));