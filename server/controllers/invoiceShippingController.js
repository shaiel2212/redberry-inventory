const InvoiceShippingService = require('../services/invoiceShippingService');
const InvoiceModel = require('../models/invoiceModel');
const ShippingNoteModel = require('../models/shippingNoteModel');
const pool = require('../config/db');
const fs = require('fs-extra');
const path = require('path');

const InvoiceShippingController = {
  
  // הפעלת תהליך הפקת מסמכים למכירה
  async processSaleComplete(req, res) {
    try {
      const { saleId } = req.params;
      
      if (!saleId || isNaN(parseInt(saleId))) {
        return res.status(400).json({ 
          success: false, 
          message: 'מזהה מכירה לא תקין' 
        });
      }

      console.log(`🚀 בקשה להפעלת תהליך הפקת מסמכים למכירה ${saleId}`);

      // בדיקה שהמכירה קיימת ומוכנה לעיבוד
      const saleExists = await InvoiceShippingController.validateSaleForProcessing(saleId);
      if (!saleExists.success) {
        return res.status(400).json(saleExists);
      }

      // הפעלת התהליך
      const result = await InvoiceShippingService.processSaleComplete(saleId);

      res.json({
        success: true,
        message: result.message || 'תהליך הפקת מסמכים הופעל בהצלחה',
        data: result,
        invoicePath: result.invoicePath,
        shippingPath: result.shippingPath
      });

    } catch (error) {
      console.error('❌ שגיאה בהפעלת תהליך הפקת מסמכים:', error);
      
      res.status(500).json({
        success: false,
        message: 'שגיאה בהפעלת תהליך הפקת מסמכים',
        error: error.message
      });
    }
  },

  // בדיקה שהמכירה מוכנה לעיבוד
  async validateSaleForProcessing(saleId) {
    try {
      const connection = await pool.getConnection();
      
      try {
        // בדיקה שהמכירה קיימת
        const [[sale]] = await connection.query(`
          SELECT 
            s.*,
            c.full_name AS customer_name,
            s.address AS customer_address
          FROM sales s
          JOIN clients c ON s.client_id = c.id
          WHERE s.id = ?
        `, [saleId]);

        if (!sale) {
          return { success: false, message: 'המכירה לא נמצאה' };
        }

        // בדיקה שהמכירה לא עובדה כבר
        const existingInvoice = await InvoiceModel.getBySaleId(saleId);
        const existingShipping = await ShippingNoteModel.getBySaleId(saleId);

        if (existingInvoice && existingInvoice.status === 'completed') {
          return { success: false, message: 'החשבונית כבר נוצרה עבור מכירה זו' };
        }

        if (existingShipping && existingShipping.status === 'completed') {
          return { success: false, message: 'תעודת המשלוח כבר נוצרה עבור מכירה זו' };
        }

        // בדיקה שיש כתובת ללקוח
        if (!sale.customer_address) {
          return { success: false, message: 'כתובת לקוח חסרה' };
        }

        // בדיקה שיש פריטים במכירה
        const [items] = await connection.query(
          'SELECT COUNT(*) as count FROM sale_items WHERE sale_id = ?',
          [saleId]
        );

        if (items[0].count === 0) {
          return { success: false, message: 'אין פריטים במכירה' };
        }

        return { success: true, sale };

      } finally {
        connection.release();
      }

    } catch (error) {
      console.error('שגיאה בבדיקת תקינות מכירה:', error);
      return { success: false, message: 'שגיאה בבדיקת תקינות מכירה' };
    }
  },

  // קבלת רשימת חשבוניות
  async getInvoices(req, res) {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      let query = `
        SELECT 
          i.*,
          s.sale_date,
          c.full_name as customer_name,
          c.email as customer_email
        FROM invoices i
        JOIN sales s ON i.sale_id = s.id
        JOIN clients c ON s.client_id = c.id
      `;

      const params = [];
      if (status) {
        query += ' WHERE i.status = ?';
        params.push(status);
      }

      query += ' ORDER BY i.created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), offset);

      const connection = await pool.getConnection();
      
      try {
        const [invoices] = await connection.query(query, params);
        
        // ספירת סך הכל
        let countQuery = `
          SELECT COUNT(*) as total FROM invoices i
          JOIN sales s ON i.sale_id = s.id
          JOIN clients c ON s.client_id = c.id
        `;
        
        if (status) {
          countQuery += ' WHERE i.status = ?';
        }
        
        const [countResult] = await connection.query(countQuery, status ? [status] : []);
        const total = countResult[0].total;

        res.json({
          success: true,
          data: invoices,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        });

      } finally {
        connection.release();
      }

    } catch (error) {
      console.error('שגיאה בקבלת רשימת חשבוניות:', error);
      res.status(500).json({
        success: false,
        message: 'שגיאה בקבלת רשימת חשבוניות',
        error: error.message
      });
    }
  },

  // קבלת רשימת תעודות משלוח
  async getShippingNotes(req, res) {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      let query = `
        SELECT 
          sn.*,
          s.sale_date,
          c.full_name as customer_name,
          c.email as customer_email
        FROM shipping_notes sn
        JOIN sales s ON sn.sale_id = s.id
        JOIN clients c ON sn.client_id = c.id
      `;

      const params = [];
      if (status) {
        query += ' WHERE sn.status = ?';
        params.push(status);
      }

      query += ' ORDER BY sn.created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), offset);

      const connection = await pool.getConnection();
      
      try {
        const [shippingNotes] = await connection.query(query, params);
        
        // ספירת סך הכל
        let countQuery = `
          SELECT COUNT(*) as total FROM shipping_notes sn
          JOIN sales s ON sn.sale_id = s.id
          JOIN clients c ON sn.client_id = c.id
        `;
        
        if (status) {
          countQuery += ' WHERE sn.status = ?';
        }
        
        const [countResult] = await connection.query(countQuery, status ? [status] : []);
        const total = countResult[0].total;

        res.json({
          success: true,
          data: shippingNotes,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        });

      } finally {
        connection.release();
      }

    } catch (error) {
      console.error('שגיאה בקבלת רשימת תעודות משלוח:', error);
      res.status(500).json({
        success: false,
        message: 'שגיאה בקבלת רשימת תעודות משלוח',
        error: error.message
      });
    }
  },

  // קבלת רשימת תהליכים שנכשלו
  async getFailedProcesses(req, res) {
    try {
      const failedProcesses = await InvoiceShippingService.getFailedProcesses();

      res.json({
        success: true,
        data: failedProcesses
      });

    } catch (error) {
      console.error('שגיאה בקבלת רשימת תהליכים שנכשלו:', error);
      res.status(500).json({
        success: false,
        message: 'שגיאה בקבלת רשימת תהליכים שנכשלו',
        error: error.message
      });
    }
  },

  // ניסיון חוזר לתהליך שנכשל
  async retryFailedProcess(req, res) {
    try {
      const { saleId } = req.params;
      
      if (!saleId || isNaN(parseInt(saleId))) {
        return res.status(400).json({ 
          success: false, 
          message: 'מזהה מכירה לא תקין' 
        });
      }

      console.log(`🔄 ניסיון חוזר לתהליך הפקת מסמכים למכירה ${saleId}`);

      const result = await InvoiceShippingService.retryFailedProcess(saleId);

      res.json({
        success: true,
        message: 'התהליך הופעל מחדש בהצלחה',
        data: result
      });

    } catch (error) {
      console.error('❌ שגיאה בניסיון חוזר:', error);
      
      res.status(500).json({
        success: false,
        message: 'שגיאה בניסיון חוזר לתהליך',
        error: error.message
      });
    }
  },

  // הורדת קובץ PDF לפי נתיב
  async downloadPDF(req, res) {
    try {
      const { filePath } = req.query;
      
      if (!filePath) {
        return res.status(400).json({ 
          success: false, 
          message: 'נתיב קובץ חסר' 
        });
      }

      // בדיקת תקינות הנתיב
      const normalizedPath = path.normalize(filePath);
      const uploadsDir = path.join(__dirname, '..', 'uploads');
      
      if (!normalizedPath.startsWith(uploadsDir)) {
        return res.status(403).json({ 
          success: false, 
          message: 'גישה לא מורשית לקובץ' 
        });
      }

      // בדיקה שהקובץ קיים
      if (!fs.existsSync(normalizedPath)) {
        return res.status(404).json({ 
          success: false, 
          message: 'הקובץ לא נמצא' 
        });
      }

      // קבלת שם הקובץ מהנתיב
      const fileName = path.basename(normalizedPath);
      
      // הגדרת headers להורדה
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Type', 'application/pdf');

      // שליחת הקובץ
      res.sendFile(normalizedPath);

    } catch (error) {
      console.error('שגיאה בהורדת קובץ PDF:', error);
      res.status(500).json({
        success: false,
        message: 'שגיאה בהורדת קובץ PDF',
        error: error.message
      });
    }
  },

  // בדיקת בריאות המערכת
  async healthCheck(req, res) {
    try {
      const healthStatus = await InvoiceShippingService.healthCheck();

      res.json({
        success: true,
        data: healthStatus,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('שגיאה בבדיקת בריאות המערכת:', error);
      res.status(500).json({
        success: false,
        message: 'שגיאה בבדיקת בריאות המערכת',
        error: error.message
      });
    }
  },

  // קבלת סטטיסטיקות
  async getStatistics(req, res) {
    try {
      const connection = await pool.getConnection();
      
      try {
        // סטטיסטיקות חשבוניות
        const [invoiceStats] = await connection.query(`
          SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
            SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as errors,
            SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing
          FROM invoices
        `);

        // סטטיסטיקות תעודות משלוח
        const [shippingStats] = await connection.query(`
          SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
            SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as errors,
            SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing
          FROM shipping_notes
        `);

        // סטטיסטיקות לפי חודש
        const [monthlyStats] = await connection.query(`
          SELECT 
            DATE_FORMAT(created_at, '%Y-%m') as month,
            COUNT(*) as count
          FROM invoices 
          WHERE status = 'completed'
          GROUP BY DATE_FORMAT(created_at, '%Y-%m')
          ORDER BY month DESC
          LIMIT 12
        `);

        res.json({
          success: true,
          data: {
            invoices: invoiceStats[0],
            shipping: shippingStats[0],
            monthly: monthlyStats
          }
        });

      } finally {
        connection.release();
      }

    } catch (error) {
      console.error('שגיאה בקבלת סטטיסטיקות:', error);
      res.status(500).json({
        success: false,
        message: 'שגיאה בקבלת סטטיסטיקות',
        error: error.message
      });
    }
  },

  // עדכון הגדרות מערכת
  async updateSystemSettings(req, res) {
    try {
      const { companyInfo, emailSettings } = req.body;

      // עדכון הגדרות החברה בשירות PDF
      if (companyInfo) {
        Object.assign(InvoiceShippingService.pdfService.companyInfo, companyInfo);
      }

      // עדכון הגדרות מייל
      if (emailSettings) {
        // יש להוסיף לוגיקה לעדכון הגדרות מייל
        console.log('הגדרות מייל עודכנו:', emailSettings);
      }

      res.json({
        success: true,
        message: 'הגדרות המערכת עודכנו בהצלחה'
      });

    } catch (error) {
      console.error('שגיאה בעדכון הגדרות מערכת:', error);
      res.status(500).json({
        success: false,
        message: 'שגיאה בעדכון הגדרות מערכת',
        error: error.message
      });
    }
  }
};

module.exports = InvoiceShippingController; 