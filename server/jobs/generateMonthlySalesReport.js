// דוח מכירות חודשי - יצירת קובץ אקסל ושליחה במייל

const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');

// בדיקה אם nodemailer זמין
let nodemailer;
try {
  nodemailer = require('nodemailer');
} catch (error) {
  console.error('❌ nodemailer לא מותקן:', error.message);
  console.log('📦 התקן עם: npm install nodemailer');
}

const { getSalesReportData } = require('../controllers/salesController');

// הגדרות שליחת מייל
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'shay221290@gmail.com',
    pass: 'dlfz tdiw usfm toba', // App Password בלבד!
  },
});

// שליחת מייל עם קובץ מצורף
async function sendReportEmail(to, subject, text, attachmentPath) {
  if (!nodemailer) {
    console.error('❌ nodemailer לא זמין - לא ניתן לשלוח מייל');
    return;
  }

  // הגדרות שליחת מייל
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'shay221290@gmail.com',
      pass: 'dlfz tdiw usfm toba', // App Password בלבד!
    },
  });

  const mailOptions = {
    from: 'shay221290@gmail.com',
    to,
    subject,
    text,
    attachments: [
      {
        filename: path.basename(attachmentPath),
        path: attachmentPath,
      },
    ],
  };
  console.log('🚀 שולח מייל ל:', to, 'עם קובץ:', attachmentPath);
  await transporter.sendMail(mailOptions);
}

// עזר: ניקוי שם גיליון
function sanitizeSheetName(name, fallback = 'לקוח') {
  let clean = (name || fallback)
    .replace(/[*?:\/\[\]'"<>|.,;!@#$%^&()=+`~{}]/g, '')
    .replace(/[׳״]/g, '')
    .replace(/[^\w\u0590-\u05FF\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 31);
  if (!clean || /^[0-9]/.test(clean)) {
    clean = fallback + '_' + Math.floor(Math.random() * 10000);
  }
  return clean;
}

// פונקציה עיקרית
async function generateMonthlySalesReport(month, year) {
  // חישוב חודש נוכחי אם לא הועברו ערכים
  const now = new Date();
  if (!month || !year) {
    month = now.getMonth() + 1; // חודש נוכחי (1-12)
    year = now.getFullYear();
  }
  
  // תאריך התחלה: היום הראשון של החודש הנוכחי
  const from = new Date(year, month - 1, 1).toISOString().slice(0, 10);
  // תאריך סיום: היום הנוכחי
  const to = now.toISOString().slice(0, 10);
  const monthStr = (month < 10 ? '0' : '') + month;

  console.log(`📅 יצירת דוח מ-${from} עד ${to} (חודש ${monthStr}/${year})`);

  // שליפת נתונים
  const enrichedRows = await getSalesReportData({ startDate: from, endDate: to });

  // קיבוץ לפי לקוח
  const clientsMap = {};
  for (const row of enrichedRows) {
    const clientName = row.customer_name || 'ללא שם';
    if (!clientsMap[clientName]) clientsMap[clientName] = [];
    clientsMap[clientName].push(row);
  }

  // גיליון סיכום
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'מערכת ניהול מלאי';
  workbook.created = new Date();
  const summarySheet = workbook.addWorksheet('סיכום חודשי', {properties: {tabColor: {argb:'FFB6D7A8'}}, views: [{rightToLeft: true}] });
  summarySheet.columns = [
    { header: 'חודש', key: 'month', width: 10 },
    { header: 'שם לקוח', key: 'client_name', width: 30 },
    { header: 'מספר עסקאות', key: 'num_sales', width: 15 },
    { header: 'סכום כולל', key: 'total_amount', width: 18 },
    { header: 'סכום כולל לאחר הנחה', key: 'total_final_amount', width: 20 },
    { header: 'עלות משלוחים', key: 'total_delivery', width: 15 },
    { header: 'רווח נטו', key: 'total_profit', width: 15 },
    { header: 'בסך הכל הנחות שניתנו', key: 'total_discount', width: 20 },
  ];
  for (const clientName in clientsMap) {
    const sales = clientsMap[clientName];
    const uniqueSales = new Set(sales.map(s => s.sale_id));
    
    // סכום רק פעם אחת לכל sale_id
    const uniqueSalesArr = [];
    const seenSales = new Set();
    for (const s of sales) {
      if (!seenSales.has(s.sale_id)) {
        uniqueSalesArr.push(s);
        seenSales.add(s.sale_id);
      }
    }
    
    const totalAmount = uniqueSalesArr.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
    const totalFinalAmount = uniqueSalesArr.reduce((sum, s) => sum + Number(s.final_amount || 0), 0);
    const totalDelivery = uniqueSalesArr.reduce((sum, s) => sum + Number(s.delivery_cost || 0), 0);
    const totalProfit = uniqueSalesArr.reduce((sum, s) => sum + Number(s.final_profit || 0), 0);
    const totalDiscount = totalAmount - totalFinalAmount;
    
    summarySheet.addRow({
      month: monthStr + '/' + year,
      client_name: clientName,
      num_sales: uniqueSales.size,
      total_amount: totalAmount.toFixed(2),
      total_final_amount: totalFinalAmount.toFixed(2),
      total_delivery: totalDelivery.toFixed(2),
      total_profit: totalProfit.toFixed(2),
      total_discount: totalDiscount.toFixed(2),
    });
  }
  summarySheet.views = [{ rightToLeft: true }];

  // גיליון לכל לקוח
  for (const clientName in clientsMap) {
    const sales = clientsMap[clientName];
    const sheet = workbook.addWorksheet(sanitizeSheetName(clientName), {views: [{rightToLeft: true}] });
    sheet.columns = [
      { header: 'מספר עסקה', key: 'sale_id', width: 12 },
      { header: 'תאריך', key: 'sale_date', width: 15 },
      { header: 'לקוח', key: 'customer_name', width: 20 },
      { header: 'מוצר', key: 'product_name', width: 20 },
      { header: 'כמות', key: 'quantity', width: 8 },
      { header: 'מחיר ליחידה', key: 'price_per_unit', width: 12 },
      { header: 'סכום כולל לפריט', key: 'item_total', width: 14 },
      { header: 'הנחה (חלק יחסי)', key: 'item_discount', width: 14 },
      { header: 'עלות משלוח (חלק יחסי)', key: 'item_delivery', width: 16 },
      { header: 'סכום לאחר הנחה+משלוח לפריט', key: 'item_final', width: 20 },
      { header: 'סכום כולל לעסקה', key: 'sale_total', width: 15 },
      { header: 'סכום לאחר הנחה לעסקה', key: 'final_amount', width: 18 },
      { header: 'מוכר', key: 'sold_by', width: 15 },
      { header: 'עלות מוצר', key: 'cost_price', width: 12 },
      { header: 'רווח פריט', key: 'final_profit', width: 12 },
      { header: 'הערות', key: 'notes', width: 20 },
      { header: 'רווח כולל', key: 'final_profit', width: 12 },
    ];
    let lastSaleId = null;
    for (const row of sales) {
      const itemAmount = Number(row.price_per_unit) * Number(row.quantity);
      const itemFinal = itemAmount - Number(row.item_discount) - Number(row.item_delivery);
      sheet.addRow({
        sale_id: row.sale_id,
        sale_date: new Date(row.sale_date).toLocaleDateString('he-IL'),
        customer_name: row.customer_name,
        product_name: row.product_name,
        quantity: row.quantity,
        price_per_unit: Number(row.price_per_unit).toFixed(2),
        item_total: itemAmount.toFixed(2),
        item_discount: row.item_discount ? row.item_discount.toFixed(2) : '',
        item_delivery: row.item_delivery ? row.item_delivery.toFixed(2) : '',
        item_final: itemFinal.toFixed(2),
        sale_total: (lastSaleId !== row.sale_id) ? (Number(row.total_amount) || 0).toFixed(2) : '',
        final_amount: (lastSaleId !== row.sale_id) ? (Number(row.final_amount) || 0).toFixed(2) : '',
        sold_by: row.sold_by,
        cost_price: Number(row.cost_price).toFixed(2),
        final_profit: row.final_profit ? row.final_profit.toFixed(2) : '',
        notes: row.notes || '',
      });
      lastSaleId = row.sale_id;
    }
    sheet.views = [{ rightToLeft: true }];
  }

  // שמירה לקובץ
  const currentDate = now.toISOString().slice(0, 10).replace(/-/g, '');
  const fileName = `דוח_מכירות_${from}_עד_${to}.xlsx`;
  const filePath = path.join(__dirname, fileName);
  await workbook.xlsx.writeFile(filePath);
  console.log('✅ דוח נוצר:', filePath);

  // שליחת המייל עם הדוח המצורף
  try {
    if (nodemailer) {
      await sendReportEmail(
        ['shay221290@gmail.com',
          // 'morhakim148@gmail.com',
          // 'sofagallery21@gmail.com',
        ],
        `דוח מכירות מ-${from} עד ${to}`,
        `מצורף דוח המכירות מ-${from} עד ${to} כקובץ Excel.`,
        filePath
      );
      console.log('✅ המייל נשלח בהצלחה!');
    } else {
      console.log('⚠️ המייל לא נשלח - nodemailer לא זמין');
    }
  } catch (err) {
    console.error('❌ שגיאה בשליחת המייל:', err);
    console.log('📁 הדוח נוצר בהצלחה ב:', filePath);
  }

  return filePath;
}

module.exports = generateMonthlySalesReport;

