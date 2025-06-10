const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const salesRoutes = require('./routes/salesRoutes');
const reportsRoutes = require('./routes/reportsRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
console.log("ENV PORT:", process.env.PORT);
console.log("Final PORT:", PORT);

const allowedOrigins = [
  'https://redberry-inventory-client.vercel.app',
  'https://redberry-inventory-client-4ahsvty6p-shaiel2212s-projects.vercel.app',
  'http://localhost:3000',
];

console.log("🔧 Allowed origins:", allowedOrigins);

const corsOptions = {
  origin: function (origin, callback) {
    console.log('🔍 Request from origin:', origin);

    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      console.log('✅ Origin allowed');
      callback(null, true);
    } else {
      console.log('❌ Origin blocked:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');

  if (req.method === 'OPTIONS') {
    console.log('✅ OPTIONS request handled for:', req.path);
    res.status(200).end();
    return;
  }

  next();
});

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

app.get('/', (req, res) => {
  res.json({
    message: 'Server is running...',
    cors: 'enabled',
    allowedOrigins: allowedOrigins
  });
});

app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    console.error('❌ CORS Error for origin:', req.headers.origin);
    res.status(403).json({ 
      message: 'CORS policy violation',
      origin: req.headers.origin,
      allowedOrigins: allowedOrigins
    });
  } else {
    console.error('❌ Server Error:', err.message);
    next(err);
  }
});

app.listen(PORT, '0.0.0.0',() => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log('✅ CORS configured for origins:', allowedOrigins);
});
