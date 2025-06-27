const path = require('path');
const dotenvPath = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';

require('dotenv').config({ path: path.resolve(__dirname, '..', dotenvPath) });


console.log('🌍 Loaded environment:', process.env.NODE_ENV);
console.log('📦 DB Host:', process.env.DB_HOST);
console.log('📦 DB Name:', process.env.DB_NAME);
console.log('📦 DB User:', process.env.DB_USER);

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;