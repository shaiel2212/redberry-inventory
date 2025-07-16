const cron = require('node-cron');
const generateMonthlySalesReport = require('./generateMonthlySalesReport');

// תזמון להרצה ב-1 לחודש ב-01:00 בלילה
cron.schedule('0 1 1 * *', async () => {
  try {
    console.log('🚀 מריץ דוח חודשי אוטומטי (מתוזמן)...');
    await generateMonthlySalesReport();
    console.log('✅ דוח חודשי נוצר ונשלח בהצלחה!');
  } catch (err) {
    console.error('❌ שגיאה בהרצת דוח חודשי:', err);
  }
});

// אפשר גם להריץ ידנית לבדיקה:
if (require.main === module) {
  generateMonthlySalesReport()
    .then(() => process.exit(0))
    .catch(err => { console.error(err); process.exit(1); });
} 