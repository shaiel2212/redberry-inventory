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

// הגדרות CORS משופרות
const corsOptions = {
  origin: function (origin, callback) {
    // רשימת דומיינים מורשים
    const allowedOrigins = [
      'http://localhost:3000',
      'https://redberry-inventory-client.vercel.app',
    ];
    
    // אפשר בקשות ללא origin (כמו Postman) או מדומיינים מורשים
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
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
  optionsSuccessStatus: 200 // תמיכה בדפדפנים ישנים
};

// הגדרת CORS
app.use(cors(corsOptions));

// טיפול מפורש ב-OPTIONS preflight
app.options('*', cors(corsOptions));

// Middleware נוסף לכותרות CORS (גיבוי)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:3000',
    'https://redberry-inventory-client.vercel.app'
  ];
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/reports', reportsRoutes);

app.get('/', (req, res) => {
  res.send('Server is running...');
});

// טיפול בשגיאות CORS
app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    res.status(403).json({ 
      message: 'CORS policy violation',
      origin: req.headers.origin 
    });
  } else {
    next(err);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});