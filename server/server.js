const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const corsOptions = require('./config/corsConfig'); // ← חדש
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const salesRoutes = require('./routes/salesRoutes');
const reportsRoutes = require('./routes/reportsRoutes');
const deliveriesRoutes = require('./routes/deliveriesRoutes');
const clientRoutes = require('./routes/clientRoutes');

const envPath = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
dotenv.config({ path: envPath });
const app = express();
const PORT = process.env.PORT || 5001;



app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(cookieParser());

app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path} - Origin: ${req.headers.origin}`);
  next();
});


app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/deliveries', deliveriesRoutes);
app.use('/api/clients', clientRoutes);


app.get('/', (req, res) => {
  res.json({ message: 'Server is running...', cors: 'enabled' });
});

app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    console.error('❌ CORS Error for origin:', req.headers.origin);
    res.status(403).json({ message: 'CORS policy violation', origin: req.headers.origin });
  } else {
    console.error('❌ Server Error:', err.message);
    next(err);
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
