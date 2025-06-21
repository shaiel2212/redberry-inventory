require('dotenv').config({ path: '.env.test' });
const mysql = require('mysql2/promise');

(async () => {
  try {
    console.log('🔌 מנסה להתחבר ל־DB...');
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    const [rows] = await connection.query('SELECT 1 + 1 AS result');
    console.log('✅ חיבור הצליח! התוצאה:', rows[0].result);
    await connection.end();
  } catch (err) {
    console.error('❌ שגיאה בחיבור:', err.message);
  }
})();
