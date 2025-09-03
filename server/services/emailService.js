const nodemailer = require('nodemailer');
const fs = require('fs-extra');
const path = require('path');

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.retryAttempts = 3;
    this.retryDelay = 5000; // 5 שניות
  }

  // הגדרת שירות המייל
  async configure() {
    try {
      // בדיקה אם יש משתני סביבה למייל
      if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn('⚠️ משתני סביבה למייל לא מוגדרים. שירות המייל לא יהיה זמין.');
        return false;
      }

      this.transporter = nodemailer.createTransporter({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      // בדיקת חיבור
      await this.transporter.verify();
      this.isConfigured = true;
      console.log('✅ שירות המייל מוגדר בהצלחה');
      return true;

    } catch (error) {
      console.error('❌ שגיאה בהגדרת שירות המייל:', error.message);
      this.isConfigured = false;
      return false;
    }
  }

  // שליחת מייל עם קבצים מצורפים
  async sendEmailWithAttachments(emailData) {
    if (!this.isConfigured) {
      throw new Error('שירות המייל לא מוגדר');
    }

    let lastError;
    
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const mailOptions = {
          from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
          to: emailData.to,
          subject: emailData.subject,
          html: emailData.html,
          attachments: emailData.attachments || []
        };

        const result = await this.transporter.sendMail(mailOptions);
        console.log(`✅ מייל נשלח בהצלחה ל-${emailData.to}, ניסיון ${attempt}`);
        return result;

      } catch (error) {
        lastError = error;
        console.warn(`⚠️ ניסיון ${attempt} נכשל: ${error.message}`);
        
        if (attempt < this.retryAttempts) {
          console.log(`⏳ ממתין ${this.retryDelay / 1000} שניות לפני ניסיון נוסף...`);
          await this.delay(this.retryDelay);
        }
      }
    }

    throw new Error(`שליחת המייל נכשלה לאחר ${this.retryAttempts} ניסיונות. שגיאה אחרונה: ${lastError.message}`);
  }

  // שליחת מייל חשבונית ותעודת משלוח
  async sendInvoiceAndShippingEmail(saleData, invoicePath, shippingPath) {
    try {
      // בדיקה שהקבצים קיימים
      if (!await fs.pathExists(invoicePath)) {
        throw new Error(`קובץ החשבונית לא נמצא: ${invoicePath}`);
      }
      if (!await fs.pathExists(shippingPath)) {
        throw new Error(`קובץ תעודת המשלוח לא נמצא: ${shippingPath}`);
      }

      const emailData = {
        to: saleData.customer_email,
        subject: `חשבונית ותעודת משלוח עבור הזמנה מספר ${saleData.sale_id}`,
        html: this.createInvoiceEmailHTML(saleData),
        attachments: [
          {
            filename: `חשבונית_${saleData.invoice_number}.pdf`,
            path: invoicePath
          },
          {
            filename: `תעודת_משלוח_${saleData.shipping_number}.pdf`,
            path: shippingPath
          }
        ]
      };

      return await this.sendEmailWithAttachments(emailData);

    } catch (error) {
      throw new Error(`שגיאה בשליחת מייל חשבונית ותעודת משלוח: ${error.message}`);
    }
  }

  // יצירת תוכן HTML למייל
  createInvoiceEmailHTML(saleData) {
    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>חשבונית ותעודת משלוח</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px;
            direction: rtl;
          }
          .header { 
            background-color: #f8f9fa; 
            padding: 20px; 
            text-align: center; 
            border-radius: 8px; 
            margin-bottom: 20px;
          }
          .content { 
            background-color: #ffffff; 
            padding: 20px; 
            border: 1px solid #dee2e6; 
            border-radius: 8px; 
            margin-bottom: 20px;
          }
          .footer { 
            text-align: center; 
            color: #6c757d; 
            font-size: 14px;
          }
          .highlight { 
            color: #007bff; 
            font-weight: bold;
          }
          .attachment-info {
            background-color: #e7f3ff;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
            border-right: 4px solid #007bff;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>תודה על הזמנתך, ${saleData.customer_name}!</h1>
        </div>
        
        <div class="content">
          <p>שלום ${saleData.customer_name},</p>
          
          <p>אנו שמחים לאשר את רכישתך. להלן פרטי ההזמנה:</p>
          
          <ul>
            <li><strong>מספר הזמנה:</strong> ${saleData.sale_id}</li>
            <li><strong>תאריך הזמנה:</strong> ${new Date(saleData.sale_date).toLocaleDateString('he-IL')}</li>
            <li><strong>סה"כ לתשלום:</strong> ₪${saleData.total_amount}</li>
          </ul>
          
          <div class="attachment-info">
            <h3>📎 קבצים מצורפים:</h3>
            <p>במייל זה מצורפים:</p>
            <ul>
              <li><strong>חשבונית מס</strong> - מסמך רשמי לצרכי מס</li>
              <li><strong>תעודת משלוח</strong> - מסמך למעקב משלוח</li>
            </ul>
            <p><em>אנא שמור על המסמכים לצרכי רישום ומעקב.</em></p>
          </div>
          
          <p>אם יש לך שאלות או דרישות נוספות, אנא צור קשר איתנו:</p>
          
          <ul>
            <li><strong>טלפון:</strong> ${process.env.COMPANY_PHONE || '03-1234567'}</li>
            <li><strong>דוא"ל:</strong> ${process.env.COMPANY_EMAIL || 'support@company.com'}</li>
            <li><strong>שעות פעילות:</strong> א'-ה' 9:00-18:00, ו' 9:00-14:00</li>
          </ul>
        </div>
        
        <div class="footer">
          <p>תודה על בחירתך!</p>
          <p>צוות ${process.env.COMPANY_NAME || 'חברת הרהיטים שלך'}</p>
        </div>
      </body>
      </html>
    `;
  }

  // שליחת מייל שגיאה למנהלים
  async sendErrorNotificationToAdmins(errorData) {
    try {
      if (!this.isConfigured) {
        console.warn('שירות המייל לא מוגדר - לא ניתן לשלוח התראת שגיאה');
        return false;
      }

      const adminEmails = process.env.ADMIN_EMAILS ? 
        process.env.ADMIN_EMAILS.split(',') : 
        [process.env.EMAIL_USER];

      const emailData = {
        to: adminEmails.join(','),
        subject: `🚨 התראת שגיאה - מערכת חשבוניות ותעודות משלוח`,
        html: this.createErrorNotificationHTML(errorData)
      };

      await this.sendEmailWithAttachments(emailData);
      console.log('✅ התראת שגיאה נשלחה למנהלים');
      return true;

    } catch (error) {
      console.error('❌ שגיאה בשליחת התראת שגיאה למנהלים:', error.message);
      return false;
    }
  }

  // יצירת תוכן HTML להתראת שגיאה
  createErrorNotificationHTML(errorData) {
    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>התראת שגיאה</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px;
            direction: rtl;
          }
          .error-header { 
            background-color: #f8d7da; 
            color: #721c24; 
            padding: 20px; 
            text-align: center; 
            border-radius: 8px; 
            margin-bottom: 20px;
            border: 1px solid #f5c6cb;
          }
          .error-details { 
            background-color: #fff3cd; 
            padding: 20px; 
            border: 1px solid #ffeaa7; 
            border-radius: 8px; 
            margin-bottom: 20px;
          }
          .error-stack { 
            background-color: #f8f9fa; 
            padding: 15px; 
            border-radius: 5px; 
            font-family: monospace; 
            font-size: 12px; 
            overflow-x: auto;
            border: 1px solid #dee2e6;
          }
        </style>
      </head>
      <body>
        <div class="error-header">
          <h1>🚨 התראת שגיאה במערכת</h1>
        </div>
        
        <div class="error-details">
          <h2>פרטי השגיאה:</h2>
          <ul>
            <li><strong>סוג השגיאה:</strong> ${errorData.type}</li>
            <li><strong>מזהה מכירה:</strong> ${errorData.saleId || 'לא זמין'}</li>
            <li><strong>זמן השגיאה:</strong> ${new Date().toLocaleString('he-IL')}</li>
            <li><strong>הודעת השגיאה:</strong> ${errorData.message}</li>
          </ul>
        </div>
        
        <div class="error-details">
          <h2>פרטים טכניים:</h2>
          <div class="error-stack">
            ${errorData.stack || 'לא זמין'}
          </div>
        </div>
        
        <div class="error-details">
          <h2>פעולות מומלצות:</h2>
          <ol>
            <li>בדוק את לוגי המערכת לפרטים נוספים</li>
            <li>ודא שכל השירותים פועלים כראוי</li>
            <li>בדוק את חיבור מסד הנתונים</li>
            <li>בדוק את הגדרות שירות המייל</li>
          </ol>
        </div>
        
        <p><em>הודעה זו נשלחה אוטומטית על ידי מערכת הניטור.</em></p>
      </body>
      </html>
    `;
  }

  // בדיקת תקינות כתובת מייל
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // השהייה
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // בדיקת חיבור
  async testConnection() {
    if (!this.isConfigured) {
      return { success: false, message: 'שירות המייל לא מוגדר' };
    }

    try {
      await this.transporter.verify();
      return { success: true, message: 'חיבור תקין' };
    } catch (error) {
      return { success: false, message: `שגיאת חיבור: ${error.message}` };
    }
  }

  // ניקוי קבצים זמניים
  async cleanupTempFiles(filePaths) {
    try {
      for (const filePath of filePaths) {
        if (await fs.pathExists(filePath)) {
          await fs.remove(filePath);
          console.log(`🗑️ קובץ זמני נמחק: ${filePath}`);
        }
      }
    } catch (error) {
      console.error('❌ שגיאה בניקוי קבצים זמניים:', error.message);
    }
  }
}

module.exports = new EmailService(); 