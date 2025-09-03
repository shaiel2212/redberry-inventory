const pool = require('../config/db');
const PDFService = require('./pdfServicePuppeteer');
const EmailService = require('./emailService');
const InvoiceModel = require('../models/invoiceModel');
const ShippingNoteModel = require('../models/shippingNoteModel');
const fs = require('fs-extra');
const path = require('path');

class InvoiceShippingService {
  constructor() {
    this.pdfService = PDFService;
    this.emailService = EmailService;
    this.maxRetries = 3;
    this.retryDelay = 5000; // 5 שניות
  }

  // התהליך הראשי - יצירת חשבונית, תעודת משלוח ושליחת מייל
  async processSaleComplete(saleId) {
    console.log(`🚀 התחלת תהליך הפקת מסמכים למכירה ${saleId}`);
    
    let invoiceId = null;
    let shippingNoteId = null;
    let tempFiles = [];
    
    try {
      // שלב 1: איסוף נתוני המכירה
      const saleData = await this.collectSaleData(saleId);
      if (!saleData) {
        throw new Error('לא ניתן לאסוף נתוני מכירה');
      }

      // שלב 2: יצירת חשבונית
      console.log(`📄 יצירת חשבונית למכירה ${saleId}`);
      const invoiceResult = await this.createInvoice(saleData);
      invoiceId = invoiceResult.id;
      tempFiles.push(invoiceResult.pdfPath);

      // שלב 3: יצירת תעודת משלוח
      console.log(`📋 יצירת תעודת משלוח למכירה ${saleId}`);
      const shippingResult = await this.createShippingNote(saleData);
      shippingNoteId = shippingResult.id;
      tempFiles.push(shippingResult.pdfPath);

      // שלב 4: שליחת מייל (אופציונלי)
      console.log(`📧 ניסיון שליחת מייל למכירה ${saleId}`);
      try {
        await this.sendEmail(saleData, invoiceResult.pdfPath, shippingResult.pdfPath);
      } catch (emailError) {
        console.warn('⚠️ שליחת מייל נכשלה, אבל המסמכים נוצרו:', emailError.message);
        // לא זורקים שגיאה - המסמכים נוצרו בהצלחה
      }

      // שלב 5: עדכון סטטוסים
      await this.updateStatuses(invoiceId, shippingNoteId, 'completed');

      console.log(`✅ תהליך הפקת מסמכים הושלם בהצלחה למכירה ${saleId}`);
      
      // הודעה מותאמת לפי האם המייל נשלח
      const message = saleData.customer_email && saleData.customer_email !== 'no-email@example.com' 
        ? 'המסמכים נוצרו ונשלחו בהצלחה' 
        : 'המסמכים נוצרו בהצלחה (מייל לא נשלח - אין כתובת מייל)';
      
      console.log(`🎯 המסמכים נשמרו:`, {
        invoice: invoiceResult.pdfPath,
        shipping: shippingResult.pdfPath
      });
      
      return {
        success: true,
        invoiceId,
        shippingNoteId,
        message,
        emailSent: saleData.customer_email && saleData.customer_email !== 'no-email@example.com',
        invoicePath: invoiceResult.pdfPath,
        shippingPath: shippingResult.pdfPath
      };

    } catch (error) {
      console.error(`❌ שגיאה בתהליך הפקת מסמכים למכירה ${saleId}:`, error);
      
      // עדכון סטטוסים לשגיאה
      if (invoiceId) {
        await InvoiceModel.updateStatus(invoiceId, 'error', error.message);
      }
      if (shippingNoteId) {
        await ShippingNoteModel.updateStatus(shippingNoteId, 'error', error.message);
      }

      // שליחת התראת שגיאה למנהלים
      await this.notifyAdminsOfError(error, saleId);

      // ניקוי קבצים זמניים
      await this.cleanupTempFiles(tempFiles);

      throw error;
    }
  }

  // איסוף נתוני מכירה
  async collectSaleData(saleId) {
    try {
      const connection = await pool.getConnection();
      
      try {
        // שליפת פרטי המכירה
        const [[sale]] = await connection.query(`
          SELECT 
            s.*,
            c.full_name AS customer_name,
            s.address AS customer_address,
            c.phone AS customer_phone
          FROM sales s
          JOIN clients c ON s.client_id = c.id
          WHERE s.id = ?
        `, [saleId]);

        if (!sale) {
          throw new Error(`מכירה ${saleId} לא נמצאה`);
        }

        // שליפת פריטי המכירה
        const [items] = await connection.query(`
          SELECT 
            si.*,
            p.name AS product_name
          FROM sale_items si
          JOIN products p ON si.product_id = p.id
          WHERE si.sale_id = ?
        `, [saleId]);

        if (!items || items.length === 0) {
          throw new Error(`לא נמצאו פריטים במכירה ${saleId}`);
        }

        // בדיקת תקינות נתונים
        this.validateSaleData(sale, items);

        return {
          ...sale,
          items
        };

      } finally {
        connection.release();
      }

    } catch (error) {
      throw new Error(`שגיאה באיסוף נתוני מכירה: ${error.message}`);
    }
  }

  // בדיקת תקינות נתוני מכירה
  validateSaleData(sale, items) {
    if (!sale.customer_name) {
      throw new Error('שם לקוח חסר');
    }

    if (!sale.customer_address) {
      throw new Error('כתובת לקוח חסרה');
    }

    if (!items || items.length === 0) {
      throw new Error('רשימת פריטים ריקה');
    }

    for (const item of items) {
      if (!item.product_name) {
        throw new Error(`שם מוצר חסר לפריט ${item.product_id}`);
      }
      if (!item.price_per_unit || item.price_per_unit <= 0) {
        throw new Error(`מחיר לא תקין למוצר ${item.product_name}`);
      }
      if (!item.quantity || item.quantity <= 0) {
        throw new Error(`כמות לא תקינה למוצר ${item.product_name}`);
      }
    }
  }

  // יצירת חשבונית
  async createInvoice(saleData) {
    try {
      // קבלת מספר חשבונית חדש
      const invoiceNumber = await InvoiceModel.getNextInvoiceNumber();
      
      // וידוא שהערכים הם מספרים
      const totalAmount = parseFloat(saleData.total_amount) || 0;
      const vatAmount = totalAmount * 0.17; // 17% מע"מ
      const finalAmount = totalAmount * 1.17;

      // יצירת רשומת חשבונית במסד הנתונים
      const invoiceId = await InvoiceModel.create({
        sale_id: saleData.id,
        invoice_number: invoiceNumber,
        customer_name: saleData.customer_name,
        customer_address: saleData.customer_address,
        customer_phone: saleData.customer_phone || 'לא צוין',
        customer_email: 'no-email@example.com', // ברירת מחדל
        customer_tax_id: null, // לא נדרש
        total_amount: totalAmount,
        vat_amount: vatAmount,
        final_amount: finalAmount,
        status: 'processing'
      });

      // יצירת תיקיית PDFs
      const pdfDir = await this.pdfService.ensurePdfDirectory();
      
      // יצירת שם קובץ בטוח
      const timestamp = Date.now();
      const safeInvoiceNumber = String(invoiceNumber).replace(/[^a-zA-Z0-9]/g, '_');
      const invoicePath = path.join(pdfDir, `invoice_${safeInvoiceNumber}_${timestamp}.pdf`);
      
      console.log(`📄 יצירת חשבונית: ${invoicePath}`);

      // הכנת נתונים ל-PDF
      const pdfData = {
        ...saleData,
        invoice_number: invoiceNumber,
        sale_id: saleData.id,
        items: saleData.items || [],
        total_amount: parseFloat(saleData.total_amount) || 0
      };
      
      console.log(`📊 נתונים ל-PDF:`, {
        invoice_number: pdfData.invoice_number,
        customer_name: pdfData.customer_name,
        items_count: pdfData.items.length,
        total_amount: pdfData.total_amount
      });

      // יצירת קובץ PDF עם Puppeteer
      await this.pdfService.createInvoicePDF(pdfData, invoicePath);

      // עדכון נתיב הקובץ במסד הנתונים
      await InvoiceModel.updatePdfPath(invoiceId, invoicePath);

      console.log(`✅ חשבונית נוצרה בהצלחה: ${invoiceNumber}`);

      return {
        id: invoiceId,
        invoiceNumber,
        pdfPath: invoicePath
      };

    } catch (error) {
      throw new Error(`שגיאה ביצירת חשבונית: ${error.message}`);
    }
  }

  // יצירת תעודת משלוח
  async createShippingNote(saleData) {
    try {
      // קבלת מספר תעודת משלוח חדש
      const shippingNumber = await ShippingNoteModel.getNextShippingNumber();
      
      // וידוא שהערכים הם מספרים
      const totalAmount = parseFloat(saleData.total_amount) || 0;

      // יצירת רשומת תעודת משלוח במסד הנתונים
      const shippingNoteId = await ShippingNoteModel.create({
        sale_id: saleData.id,
        shipping_number: shippingNumber,
        customer_name: saleData.customer_name,
        customer_address: saleData.customer_address,
        customer_phone: saleData.customer_phone || 'לא צוין',
        customer_email: 'no-email@example.com', // ברירת מחדל
        total_amount: totalAmount,
        status: 'processing'
      });

      // יצירת תיקיית PDFs
      const pdfDir = await this.pdfService.ensurePdfDirectory();
      
      // יצירת שם קובץ בטוח
      const timestamp = Date.now();
      const safeShippingNumber = String(shippingNumber).replace(/[^a-zA-Z0-9]/g, '_');
      const shippingPath = path.join(pdfDir, `shipping_${safeShippingNumber}_${timestamp}.pdf`);
      
      console.log(`📄 יצירת תעודת משלוח: ${shippingPath}`);

      // הכנת נתונים ל-PDF
      const pdfData = {
        ...saleData,
        shipping_number: shippingNumber,
        sale_id: saleData.id,
        items: saleData.items || [],
        total_amount: parseFloat(saleData.total_amount) || 0
      };
      
      console.log(`📊 נתונים ל-PDF:`, {
        shipping_number: pdfData.shipping_number,
        customer_name: pdfData.customer_name,
        items_count: pdfData.items.length,
        total_amount: pdfData.total_amount
      });

      // יצירת קובץ PDF עם Puppeteer
      await this.pdfService.createShippingNotePDF(pdfData, shippingPath);

      // עדכון נתיב הקובץ במסד הנתונים
      await ShippingNoteModel.updatePdfPath(shippingNoteId, shippingPath);

      console.log(`✅ תעודת משלוח נוצרה בהצלחה: ${shippingNumber}`);

      return {
        id: shippingNoteId,
        shippingNumber,
        pdfPath: shippingPath
      };

    } catch (error) {
      throw new Error(`שגיאה ביצירת תעודת משלוח: ${error.message}`);
    }
  }

  // שליחת מייל
  async sendEmail(saleData, invoicePath, shippingPath) {
    try {
      // בדיקה ששירות המייל מוגדר
      if (!this.emailService.isConfigured) {
        throw new Error('שירות המייל לא מוגדר');
      }

      // בדיקה אם יש כתובת מייל אמיתית
      if (!saleData.customer_email || saleData.customer_email === 'no-email@example.com') {
        console.log('⚠️ אין כתובת מייל אמיתית - דילוג על שליחת מייל');
        return;
      }

      // שליחת המייל עם קבצים מצורפים
      await this.emailService.sendInvoiceAndShippingEmail(saleData, invoicePath, shippingPath);

      console.log(`✅ מייל נשלח בהצלחה ל-${saleData.customer_email}`);

    } catch (error) {
      throw new Error(`שגיאה בשליחת מייל: ${error.message}`);
    }
  }

  // עדכון סטטוסים
  async updateStatuses(invoiceId, shippingNoteId, status) {
    try {
      if (invoiceId) {
        await InvoiceModel.updateStatus(invoiceId, status);
      }
      if (shippingNoteId) {
        await ShippingNoteModel.updateStatus(shippingNoteId, status);
      }
    } catch (error) {
      console.error('שגיאה בעדכון סטטוסים:', error);
    }
  }

  // התראת שגיאה למנהלים
  async notifyAdminsOfError(error, saleId) {
    try {
      await this.emailService.sendErrorNotificationToAdmins({
        type: 'תהליך הפקת מסמכים',
        saleId,
        message: error.message,
        stack: error.stack
      });
    } catch (notifyError) {
      console.error('שגיאה בשליחת התראת שגיאה למנהלים:', notifyError);
    }
  }

  // ניסיון חוזר לתהליך שנכשל
  async retryFailedProcess(saleId) {
    console.log(`🔄 ניסיון חוזר לתהליך הפקת מסמכים למכירה ${saleId}`);
    
    try {
      return await this.processSaleComplete(saleId);
    } catch (error) {
      console.error(`❌ ניסיון חוזר נכשל למכירה ${saleId}:`, error);
      throw error;
    }
  }

  // קבלת רשימת תהליכים שנכשלו
  async getFailedProcesses() {
    try {
      const [failedInvoices] = await pool.query(`
        SELECT 
          i.*,
          s.sale_date,
          c.full_name as customer_name,
          'invoice' as document_type
        FROM invoices i
        JOIN sales s ON i.sale_id = s.id
        JOIN clients c ON s.client_id = c.id
        WHERE i.status = 'error'
        ORDER BY i.created_at DESC
      `);

      const [failedShipping] = await pool.query(`
        SELECT 
          sn.*,
          s.sale_date,
          c.full_name as customer_name,
          'shipping' as document_type
        FROM shipping_notes sn
        JOIN sales s ON sn.sale_id = s.id
        JOIN clients c ON s.client_id = c.id
        WHERE sn.status = 'error'
        ORDER BY sn.created_at DESC
      `);

      return {
        invoices: failedInvoices,
        shipping: failedShipping
      };

    } catch (error) {
      throw new Error(`שגיאה בקבלת רשימת תהליכים שנכשלו: ${error.message}`);
    }
  }

  // ניקוי קבצים זמניים
  async cleanupTempFiles(filePaths) {
    try {
      await this.emailService.cleanupTempFiles(filePaths);
    } catch (error) {
      console.error('שגיאה בניקוי קבצים זמניים:', error);
    }
  }

  // בדיקת בריאות המערכת
  async healthCheck() {
    const results = {
      database: false,
      pdfService: false,
      emailService: false,
      overall: false
    };

    try {
      // בדיקת מסד נתונים
      const connection = await pool.getConnection();
      await connection.ping();
      connection.release();
      results.database = true;
    } catch (error) {
      console.error('שגיאה בבדיקת מסד נתונים:', error);
    }

    try {
      // בדיקת שירות PDF
      const pdfDir = await this.pdfService.ensurePdfDirectory();
      results.pdfService = true;
    } catch (error) {
      console.error('שגיאה בבדיקת שירות PDF:', error);
    }

    try {
      // בדיקת שירות מייל
      const emailStatus = await this.emailService.testConnection();
      results.emailService = emailStatus.success;
    } catch (error) {
      console.error('שגיאה בבדיקת שירות מייל:', error);
    }

    results.overall = results.database && results.pdfService && results.emailService;
    
    return results;
  }
}

module.exports = new InvoiceShippingService(); 