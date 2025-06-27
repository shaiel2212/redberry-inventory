require('dotenv').config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env' });
console.log('🌍 Loaded environment:', process.env.NODE_ENV);
console.log('📦 DB Host:', process.env.DB_HOST);
console.log('📦 DB Name:', process.env.DB_NAME);
console.log('📦 DB User:', process.env.DB_USER);
const pool = require('../config/db'); // ייבא את מאגר הנתונים שלך
const cron = require('node-cron');
console.log('🌍 Loaded environment:', process.env.NODE_ENV);
console.log('📦 DB Name:', process.env.DB_NAME);
async function checkRestockedItems() {
  try {
    // שלב 1: מציאת רשומות חסרות במלאי שחזרו
    const [rows] = await pool.query(`
      SELECT si.id AS sale_item_id, si.product_id, si.quantity, d.id AS delivery_id
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      JOIN deliveries d ON si.sale_id = d.sale_id
      WHERE si.is_supplied = FALSE
        AND p.stock_quantity >= si.quantity
        AND d.status = 'awaiting_stock'
    `);

    if (!rows.length) {
      console.log('🔎 לא נמצאו פריטים שחזרו למלאי.');
      return;
    }

    // שלב 2: עדכון is_supplied לכל אחד
    const updateSaleItems = rows.map(row => {
      return pool.query(`UPDATE sale_items SET is_supplied = TRUE WHERE id = ?`, [row.sale_item_id]);
    });
    await Promise.all(updateSaleItems);
    console.log(`✅ עודכנו ${rows.length} פריטים שחזרו למלאי.`);

    // שלב 3: בדיקה האם כל הפריטים באותה מכירה הושלמו → עדכון סטטוס משלוח
    const deliveryIds = [...new Set(rows.map(row => row.delivery_id))];
    for (const deliveryId of deliveryIds) {
      const [pendingItems] = await pool.query(`
        SELECT * FROM sale_items si
        JOIN deliveries d ON si.sale_id = d.sale_id
        WHERE d.id = ? AND si.is_supplied = FALSE
      `, [deliveryId]);

      if (pendingItems.length === 0) {
        await pool.query(`
          UPDATE deliveries
          SET status = 'pending'
          WHERE id = ?
        `, [deliveryId]);
        console.log(`🚚 משלוח #${deliveryId} הועבר לממתינים.`);
      }
    }
  } catch (error) {
    console.error('❌ שגיאה בבדיקת מלאי:', error);
  }
}
checkRestockedItems();

// // הפעלת הסקריפט אחת לשבוע – כל יום ראשון ב־03:00 בלילה
// cron.schedule('0 3 * * 0', () => {
//   console.log('🕒 הפעלת סקריפט בדיקת מלאי...');
//   checkRestockedItems();
// });
