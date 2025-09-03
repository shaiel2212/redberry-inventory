const PDFDocument = require('pdfkit');
const fs = require('fs-extra');
const path = require('path');

// פונט שתומך בעברית
const hebrewFontPath = path.join(__dirname, '..', 'fonts', 'NotoSansHebrew-Regular.ttf');
const hebrewFontWoff2Path = path.join(__dirname, '..', 'fonts', 'noto-sans-hebrew-hebrew-400-normal.woff2');

class PDFService {
  constructor() {
    // הגדרות החברה - יש לעדכן לפי הפרטים האמיתיים
    this.companyInfo = {
      name: 'חברת הרהיטים שלך',
      address: 'רחוב הראשי 123, תל אביב',
      phone: '03-1234567',
      email: 'info@company.com',
      taxId: '123456789',
      logo: null // נתיב ללוגו אם קיים
    };
    
    // הגדרות מע"מ
    this.vatRate = 0.17; // 17% מע"מ בישראל
  }

  // יצירת חשבונית
  async createInvoicePDF(saleData, outputPath) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: {
            top: 50,
            bottom: 50,
            left: 50,
            right: 50
          }
        });

        // הוספת פונט עברית אם קיים
        let hebrewFont = null;
        try {
          if (fs.existsSync(hebrewFontPath)) {
            hebrewFont = doc.font(hebrewFontPath);
            console.log('✅ פונט עברית נטען בהצלחה');
          } else {
            console.log('⚠️ פונט עברית לא נמצא, משתמש בפונט ברירת מחדל');
            hebrewFont = doc.font('Helvetica');
          }
        } catch (fontError) {
          console.log('⚠️ שגיאה בטעינת פונט עברית, משתמש בפונט ברירת מחדל:', fontError.message);
          hebrewFont = doc.font('Helvetica');
        }

        const stream = fs.createWriteStream(outputPath);
        doc.pipe(stream);

        // הוספת לוגו (אם קיים)
        if (this.companyInfo.logo && fs.existsSync(this.companyInfo.logo)) {
          doc.image(this.companyInfo.logo, 50, 50, { width: 100 });
        }

        // כותרת ראשית - חשבונית מס
        hebrewFont.fontSize(24)
           .text('חשבונית מס', { align: 'center' })
           .moveDown(0.5);

        // פרטי החברה
        hebrewFont.fontSize(12)
           .text(this.companyInfo.name, { align: 'right' })
           .text(this.companyInfo.address, { align: 'right' })
           .text(`טלפון: ${this.companyInfo.phone}`, { align: 'right' })
           .text(`דוא"ל: ${this.companyInfo.email}`, { align: 'right' })
           .text(`עוסק מורשה: ${this.companyInfo.taxId}`, { align: 'right' })
           .moveDown(1);

        // פרטי החשבונית
        hebrewFont.fontSize(14)
           .text('פרטי החשבונית', { align: 'right' })
           .moveDown(0.5);

        hebrewFont.fontSize(12)
           .text(`מספר חשבונית: ${saleData.invoice_number}`, { align: 'right' })
           .text(`תאריך הנפקה: ${new Date().toLocaleDateString('he-IL')}`, { align: 'right' })
           .text(`מספר הזמנה: ${saleData.sale_id}`, { align: 'right' })
           .moveDown(1);

        // פרטי הלקוח
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text('פרטי הלקוח', { align: 'right' })
           .moveDown(0.5);

        doc.fontSize(12)
           .font('Helvetica')
           .text(`שם: ${saleData.customer_name}`, { align: 'right' })
           .text(`כתובת: ${saleData.customer_address}`, { align: 'right' })
           .text(`טלפון: ${saleData.customer_phone || 'לא צוין'}`, { align: 'right' })
           .text(`דוא"ל: ${saleData.customer_email || 'לא צוין'}`, { align: 'right' })
           .moveDown(1);

        // טבלת המוצרים
        this.createProductsTable(doc, saleData.items);

        // סיכום תשלום
        this.createPaymentSummary(doc, saleData);

        // הערות
        if (saleData.notes) {
          hebrewFont.moveDown(1)
             .fontSize(12)
             .text('הערות:', { align: 'right' })
             .moveDown(0.5)
             .text(saleData.notes, { align: 'right' });
        }

        // תנאי תשלום
        hebrewFont.moveDown(2)
           .fontSize(10)
           .text('תנאי תשלום: תשלום מיידי', { align: 'center' })
           .text('תודה על רכישתך!', { align: 'center' });

        // סיום המסמך
        doc.end();

        // המתנה לסיום הכתיבה
        stream.on('finish', () => {
          console.log(`✅ קובץ PDF נוצר בהצלחה: ${outputPath}`);
          resolve(outputPath);
        });

        stream.on('error', (error) => {
          console.error(`❌ שגיאה ביצירת קובץ PDF: ${error.message}`);
          reject(new Error(`שגיאה ביצירת קובץ PDF: ${error.message}`));
        });

        // טיפול בשגיאות של המסמך
        doc.on('error', (error) => {
          console.error(`❌ שגיאה במסמך PDF: ${error.message}`);
          reject(new Error(`שגיאה במסמך PDF: ${error.message}`));
        });

      } catch (error) {
        reject(new Error(`שגיאה ביצירת חשבונית: ${error.message}`));
      }
    });
  }

  // יצירת תעודת משלוח
  async createShippingNotePDF(saleData, outputPath) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: {
            top: 50,
            bottom: 50,
            left: 50,
            right: 50
          }
        });

        // הוספת פונט עברית אם קיים
        let hebrewFont = null;
        try {
          if (fs.existsSync(hebrewFontPath)) {
            hebrewFont = doc.font(hebrewFontPath);
            console.log('✅ פונט עברית נטען בהצלחה');
          } else {
            console.log('⚠️ פונט עברית לא נמצא, משתמש בפונט ברירת מחדל');
            hebrewFont = doc.font('Helvetica');
          }
        } catch (fontError) {
          console.log('⚠️ שגיאה בטעינת פונט עברית, משתמש בפונט ברירת מחדל:', fontError.message);
          hebrewFont = doc.font('Helvetica');
        }

        const stream = fs.createWriteStream(outputPath);
        doc.pipe(stream);

        // הוספת לוגו (אם קיים)
        if (this.companyInfo.logo && fs.existsSync(this.companyInfo.logo)) {
          doc.image(this.companyInfo.logo, 50, 50, { width: 100 });
        }

        // כותרת ראשית - תעודת משלוח
        hebrewFont.fontSize(24)
           .text('תעודת משלוח', { align: 'center' })
           .moveDown(0.5);

        // פרטי החברה
        hebrewFont.fontSize(12)
           .text(this.companyInfo.name, { align: 'right' })
           .text(this.companyInfo.address, { align: 'right' })
           .text(`טלפון: ${this.companyInfo.phone}`, { align: 'right' })
           .text(`דוא"ל: ${this.companyInfo.email}`, { align: 'right' })
           .moveDown(1);

        // פרטי תעודת המשלוח
        hebrewFont.fontSize(14)
           .text('פרטי תעודת המשלוח', { align: 'right' })
           .moveDown(0.5);

        hebrewFont.fontSize(12)
           .text(`מספר תעודה: ${saleData.shipping_number}`, { align: 'right' })
           .text(`תאריך הנפקה: ${new Date().toLocaleDateString('he-IL')}`, { align: 'right' })
           .text(`מספר הזמנה: ${saleData.sale_id}`, { align: 'right' })
           .moveDown(1);

        // פרטי הלקוח
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text('פרטי הלקוח', { align: 'right' })
           .moveDown(0.5);

        doc.fontSize(12)
           .font('Helvetica')
           .text(`שם: ${saleData.customer_name}`, { align: 'right' })
           .text(`כתובת: ${saleData.customer_address}`, { align: 'right' })
           .text(`טלפון: ${saleData.customer_phone || 'לא צוין'}`, { align: 'right' })
           .text(`דוא"ל: ${saleData.customer_email || 'לא צוין'}`, { align: 'right' })
           .moveDown(1);

        // טבלת המוצרים (ללא מע"מ)
        this.createProductsTable(doc, saleData.items, false);

        // סיכום (ללא מע"מ)
        hebrewFont.moveDown(1)
           .fontSize(14)
           .text('סיכום:', { align: 'right' })
           .moveDown(0.5)
           .fontSize(12)
           .text(`סה"כ לתשלום: ₪${(parseFloat(saleData.total_amount) || 0).toFixed(2)}`, { align: 'right' });

        // הערות
        if (saleData.notes) {
          hebrewFont.moveDown(1)
             .fontSize(12)
             .text('הערות:', { align: 'right' })
             .moveDown(0.5)
             .text(saleData.notes, { align: 'right' });
        }

        // חתימה
        hebrewFont.moveDown(2)
           .fontSize(10)
           .text('חתימת מקבל: _________________', { align: 'left' })
           .text('תאריך: _________________', { align: 'left' });

        // סיום המסמך
        doc.end();

        // המתנה לסיום הכתיבה
        stream.on('finish', () => {
          console.log(`✅ קובץ PDF נוצר בהצלחה: ${outputPath}`);
          resolve(outputPath);
        });

        stream.on('error', (error) => {
          console.error(`❌ שגיאה ביצירת קובץ PDF: ${error.message}`);
          reject(new Error(`שגיאה ביצירת קובץ PDF: ${error.message}`));
        });

        // טיפול בשגיאות של המסמך
        doc.on('error', (error) => {
          console.error(`❌ שגיאה במסמך PDF: ${error.message}`);
          reject(new Error(`שגיאה במסמך PDF: ${error.message}`));
        });

      } catch (error) {
        reject(new Error(`שגיאה ביצירת תעודת משלוח: ${error.message}`));
      }
    });
  }

  // יצירת טבלת מוצרים
  createProductsTable(doc, items, includeVat = true) {
    // שימוש בפונט עברית אם קיים
    const font = doc._font ? doc : doc.font('Helvetica');
    
    font.fontSize(14)
       .text('פירוט המוצרים', { align: 'right' })
       .moveDown(0.5);

    // כותרות הטבלה
    const tableTop = doc.y;
    const colWidth = 100;
    const startX = 50;

    // כותרות
    font.fontSize(10)
       .text('סה"כ', startX + colWidth * 3, tableTop)
       .text('מחיר ליחידה', startX + colWidth * 2, tableTop)
       .text('כמות', startX + colWidth, tableTop)
       .text('שם המוצר', startX, tableTop);

    doc.moveDown(0.5);

    let currentY = doc.y;
    let totalAmount = 0;

    // תוכן הטבלה
    items.forEach((item, index) => {
      // וידוא שהערכים הם מספרים
      const price = parseFloat(item.price_per_unit) || 0;
      const quantity = parseInt(item.quantity) || 0;
      const itemTotal = price * quantity;
      totalAmount += itemTotal;

      font.fontSize(10)
         .text(`₪${itemTotal.toFixed(2)}`, startX + colWidth * 3, currentY)
         .text(`₪${price.toFixed(2)}`, startX + colWidth * 2, currentY)
         .text(quantity.toString(), startX + colWidth, currentY)
         .text(item.product_name, startX, currentY);

      currentY += 20;
    });

    // קו מפריד
    doc.moveTo(startX, currentY)
       .lineTo(startX + colWidth * 4, currentY)
       .stroke();

    // סה"כ
    font.fontSize(12)
       .text(`סה"כ: ₪${totalAmount.toFixed(2)}`, startX + colWidth * 3, currentY + 10);

    doc.y = currentY + 30;
  }

  // יצירת סיכום תשלום
  createPaymentSummary(doc, saleData) {
    const totalAmount = parseFloat(saleData.total_amount) || 0;
    const vatAmount = totalAmount * this.vatRate;
    const finalAmount = totalAmount + vatAmount;

    // שימוש בפונט עברית אם קיים
    const font = doc._font ? doc : doc.font('Helvetica');

    font.moveDown(1)
       .fontSize(14)
       .text('סיכום תשלום:', { align: 'right' })
       .moveDown(0.5);

    font.fontSize(12)
       .text(`סה"כ לפני מע"מ: ₪${totalAmount.toFixed(2)}`, { align: 'right' })
       .text(`מע"מ (${(this.vatRate * 100)}%): ₪${vatAmount.toFixed(2)}`, { align: 'right' })
       .text(`סה"כ לתשלום: ₪${finalAmount.toFixed(2)}`, { align: 'right' });
  }

  // יצירת תיקיית PDFs אם לא קיימת
  async ensurePdfDirectory() {
    try {
      const pdfDir = path.join(__dirname, '..', 'uploads', 'pdfs');
      console.log(`📁 יצירת תיקיית PDFs: ${pdfDir}`);
      
      // יצירת התיקייה אם לא קיימת
      await fs.ensureDir(pdfDir);
      
      // בדיקה שהתיקייה נוצרה בהצלחה
      const exists = await fs.pathExists(pdfDir);
      if (!exists) {
        throw new Error(`לא ניתן ליצור תיקייה: ${pdfDir}`);
      }
      
      console.log(`✅ תיקיית PDFs נוצרה/קיימת: ${pdfDir}`);
      return pdfDir;
    } catch (error) {
      console.error(`❌ שגיאה ביצירת תיקיית PDFs: ${error.message}`);
      throw new Error(`שגיאה ביצירת תיקיית PDFs: ${error.message}`);
    }
  }

  // ניקוי קבצים ישנים
  async cleanupOldPDFs(directory, maxAge = 24 * 60 * 60 * 1000) { // 24 שעות
    try {
      const files = await fs.readdir(directory);
      const now = Date.now();

      for (const file of files) {
        const filePath = path.join(directory, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.remove(filePath);
        }
      }
    } catch (error) {
      console.error('שגיאה בניקוי קבצי PDF ישנים:', error);
    }
  }
}

module.exports = new PDFService(); 