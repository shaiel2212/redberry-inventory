const pool = require('../config/db');
const generateMonthlySalesReport = require('../jobs/generateMonthlySalesReport');
const checkRestockedItems = require('../jobs/checkRestockedItems');

// סיכום מכירות - כולל יומי, שבועי, חודשי
exports.getSalesSummary = async (req, res) => {
  try {
    const [day] = await pool.query(
      'SELECT IFNULL(SUM(total_amount), 0) AS total FROM sales WHERE DATE(sale_date) = CURDATE()'
    );

    const [week] = await pool.query(
      `SELECT IFNULL(SUM(total_amount), 0) AS total
       FROM sales 
       WHERE sale_date >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
         AND sale_date < DATE_ADD(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), INTERVAL 7 DAY)`
    );

    const [month] = await pool.query(
      'SELECT IFNULL(SUM(total_amount), 0) AS total FROM sales WHERE MONTH(sale_date) = MONTH(CURDATE()) AND YEAR(sale_date) = YEAR(CURDATE())'
    );

    res.json({
      daily: day[0].total,
      weekly: week[0].total,
      monthly: month[0].total
    });
  } catch (err) {
    console.error('Sales summary error:', err.message);
    res.status(500).send('Error fetching sales summary');
  }
};

// מוצרים עם מלאי נמוך
exports.getLowStockProducts = async (req, res) => {
  try {
    const [lowStock] = await pool.query(
      `SELECT id, name, stock_quantity, image_url 
       FROM products 
       WHERE stock_quantity <= 5 
       ORDER BY stock_quantity ASC`
    );
    res.json(lowStock);
  } catch (err) {
    console.error('Low stock error:', err.message);
    res.status(500).send('Error fetching low stock products');
  }
};

// סיכום לפי ימים אחרונים
exports.getSalesByDay = async (req, res) => {
  try {
    const [dailySales] = await pool.query(`
      SELECT DATE(sale_date) AS date, SUM(total_amount) AS total
      FROM sales
      WHERE sale_date >= CURDATE() - INTERVAL 7 DAY
      GROUP BY DATE(sale_date)
      ORDER BY DATE(sale_date)
    `);
    res.json(dailySales);
  } catch (err) {
    console.error('Sales by day error:', err.message);
    res.status(500).send('Error fetching sales by day');
  }
};

// יצירת דוח חודשי אוטומטי
exports.generateMonthlyReport = async (req, res) => {
  try {
    console.log('🚀 מתחיל יצירת דוח חודשי אוטומטי...');
    await generateMonthlySalesReport();
    console.log('✅ דוח חודשי נוצר ונשלח בהצלחה!');
    res.json({ success: true, message: 'דוח חודשי נוצר ונשלח בהצלחה!' });
  } catch (error) {
    console.error('❌ שגיאה ביצירת דוח חודשי:', error);
    res.status(500).json({ success: false, message: 'שגיאה ביצירת הדוח', error: error.message });
  }
};

// בדיקת פריטים שחזרו למלאי
exports.checkRestockedItems = async (req, res) => {
  try {
    console.log('🚀 מתחיל בדיקת פריטים שחזרו למלאי...');
    await checkRestockedItems();
    console.log('✅ בדיקת מלאי הושלמה בהצלחה!');
    res.json({ success: true, message: 'בדיקת מלאי הושלמה בהצלחה!' });
  } catch (error) {
    console.error('❌ שגיאה בבדיקת מלאי:', error);
    res.status(500).json({ success: false, message: 'שגיאה בבדיקת מלאי', error: error.message });
  }
};

