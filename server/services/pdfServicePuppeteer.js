const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');

class PDFServicePuppeteer {
  constructor() {
    // הגדרות החברה - רדברי
    this.companyInfo = {
      name: 'רדברי יבוא ושיווק מזרנים בע"מ',
      address: 'אלכסנדר ינאי 5, פתח תקווה',
      phone: '052-9955595',
      fax: '03-9014222',
      email: 'service@redbeary.co.il',
      taxId: '16918372',
      logo: 'https://redbeary.co.il/wp-content/uploads/2024/08/26c378862eab34aae339a8267bcb72ba-300x121.webp' // URL של הלוגו - החלף כאן
    };
    
    // הגדרות מע"מ
    this.vatRate = 0.17; // 17% מע"מ בישראל
  }

  // יצירת חשבונית
  async createInvoicePDF(saleData, outputPath) {
    try {
      console.log('🚀 יצירת חשבונית עם Puppeteer...');
      
      const html = await this.generateInvoiceHTML(saleData);
      const pdfBuffer = await this.generatePDFFromHTML(html);
      
      // שמירת הקובץ
      await fs.writeFile(outputPath, pdfBuffer);
      
      console.log(`✅ חשבונית נוצרה בהצלחה: ${outputPath}`);
      return outputPath;
    } catch (error) {
      throw new Error(`שגיאה ביצירת חשבונית: ${error.message}`);
    }
  }

  // יצירת תעודת משלוח
  async createShippingNotePDF(saleData, outputPath) {
    try {
      console.log('🚀 יצירת תעודת משלוח עם Puppeteer...');
      
      const html = await this.generateShippingNoteHTML(saleData);
      const pdfBuffer = await this.generatePDFFromHTML(html);
      
      // שמירת הקובץ
      await fs.writeFile(outputPath, pdfBuffer);
      
      console.log(`✅ תעודת משלוח נוצרה בהצלחה: ${outputPath}`);
      return outputPath;
    } catch (error) {
      throw new Error(`שגיאה ביצירת תעודת משלוח: ${error.message}`);
    }
  }

  // יצירת PDF מ-HTML
  async generatePDFFromHTML(html) {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      
      // הגדרת תוכן HTML
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      // יצירת PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        }
      });

      return pdfBuffer;
    } finally {
      await browser.close();
    }
  }

  // יצירת HTML לחשבונית
  async generateInvoiceHTML(saleData) {
    const items = saleData.items || [];
    const totalAmount = parseFloat(saleData.total_amount) || 0;
    const vatAmount = totalAmount * this.vatRate;
    const finalAmount = totalAmount + vatAmount;
    
    // בדיקה אם הלוגו קיים (URL או נתיב מקומי)
    let logoUrl = null;
    if (this.companyInfo.logo) {
      if (this.companyInfo.logo.startsWith('http')) {
        // זה URL - השתמש בו ישירות
        logoUrl = this.companyInfo.logo;
      } else if (fs.existsSync(this.companyInfo.logo)) {
        // זה נתיב מקומי - המר ל-base64
        try {
          const logoBuffer = await fs.readFile(this.companyInfo.logo);
          logoUrl = `data:image/png;base64,${logoBuffer.toString('base64')}`;
        } catch (error) {
          console.log('⚠️ שגיאה בקריאת הלוגו:', error.message);
        }
      }
    }

    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>חשבונית מס</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;700&display=swap');
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Heebo', Arial, sans-serif;
            font-size: 14px;
            line-height: 1.6;
            color: #333;
            background: white;
            padding: 20px;
          }
          
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }
          
          .header h1 {
            font-size: 28px;
            font-weight: 700;
            color: #333;
            margin-bottom: 10px;
          }
          
          .company-info {
            text-align: right;
            margin-bottom: 30px;
          }
          
          .company-info h2 {
            font-size: 18px;
            font-weight: 500;
            margin-bottom: 10px;
          }
          
          .company-info p {
            margin-bottom: 5px;
          }
          
          .invoice-details {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
          }
          
          .invoice-details > div {
            flex: 1;
          }
          
          .invoice-details h3 {
            font-size: 16px;
            font-weight: 500;
            margin-bottom: 15px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
          }
          
          .invoice-details p {
            margin-bottom: 8px;
          }
          
          .products-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          
          .products-table th,
          .products-table td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: right;
          }
          
          .products-table th {
            background-color: #f8f9fa;
            font-weight: 500;
          }
          
          .products-table td {
            vertical-align: top;
          }
          
          .total-row {
            font-weight: 500;
            background-color: #f8f9fa;
          }
          
          .summary {
            text-align: left;
            margin-top: 30px;
            padding: 20px;
            background-color: #f8f9fa;
            border-radius: 5px;
          }
          
          .summary h3 {
            font-size: 18px;
            font-weight: 500;
            margin-bottom: 15px;
          }
          
          .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 5px 0;
            border-bottom: 1px solid #ddd;
          }
          
          .summary-row:last-child {
            border-bottom: none;
            font-weight: 500;
            font-size: 16px;
          }
          
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="header">
          ${logoUrl ? 
            `<img src="${logoUrl}" alt="לוגו רדברי" class="company-logo">` : 
            `<h1>חשבונית מס</h1>`
          }
        </div>
        
        <div class="company-info">
          <h2>${this.companyInfo.name}</h2>
          <p>${this.companyInfo.address}</p>
          <p>טלפון: ${this.companyInfo.phone}</p>
          <p>דוא"ל: ${this.companyInfo.email}</p>
          <p>עוסק מורשה: ${this.companyInfo.taxId}</p>
        </div>
        
        <div class="invoice-details">
          <div>
            <h3>פרטי החשבונית</h3>
            <p>מספר חשבונית: ${saleData.invoice_number}</p>
            <p>תאריך הנפקה: ${new Date().toLocaleDateString('he-IL')}</p>
            <p>מספר הזמנה: ${saleData.sale_id}</p>
          </div>
          
          <div>
            <h3>פרטי הלקוח</h3>
            <p>שם: ${saleData.customer_name}</p>
            <p>כתובת: ${saleData.customer_address}</p>
            <p>טלפון: ${saleData.customer_phone || 'לא צוין'}</p>
            <p>דוא"ל: ${saleData.customer_email || 'לא צוין'}</p>
          </div>
        </div>
        
        <table class="products-table">
          <thead>
            <tr>
              <th>שם המוצר</th>
              <th>כמות</th>
              <th>מחיר ליחידה</th>
              <th>סה"כ</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => {
              const price = parseFloat(item.price_per_unit) || 0;
              const quantity = parseInt(item.quantity) || 0;
              const itemTotal = price * quantity;
              return `
                <tr>
                  <td>${item.product_name}</td>
                  <td>${quantity}</td>
                  <td>₪${price.toFixed(2)}</td>
                  <td>₪${itemTotal.toFixed(2)}</td>
                </tr>
              `;
            }).join('')}
            <tr class="total-row">
              <td colspan="3">סה"כ לפני מע"מ</td>
              <td>₪${totalAmount.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
        
        <div class="summary">
          <h3>סיכום תשלום</h3>
          <div class="summary-row">
            <span>סה"כ לפני מע"מ:</span>
            <span>₪${totalAmount.toFixed(2)}</span>
          </div>
          <div class="summary-row">
            <span>מע"מ (${(this.vatRate * 100)}%):</span>
            <span>₪${vatAmount.toFixed(2)}</span>
          </div>
          <div class="summary-row">
            <span>סה"כ לתשלום:</span>
            <span>₪${finalAmount.toFixed(2)}</span>
          </div>
        </div>
        
        ${saleData.notes ? `
          <div class="company-info">
            <h3>הערות</h3>
            <p>${saleData.notes}</p>
          </div>
        ` : ''}
        
        <div class="footer">
          <p>תנאי תשלום: תשלום מיידי</p>
          <p>תודה על רכישתך!</p>
        </div>
      </body>
      </html>
    `;
  }

  // יצירת HTML לתעודת משלוח בסגנון רדברי
  async generateShippingNoteHTML(saleData) {
    const items = saleData.items || [];
    const totalAmount = parseFloat(saleData.total_amount) || 0;
    const discountRate = 12.50; // הנחה 12.50% כמו ברודברי
    const discountAmount = totalAmount * (discountRate / 100);
    const finalAmount = totalAmount - discountAmount;
    
    // בדיקה אם הלוגו קיים (URL או נתיב מקומי)
    let logoUrl = null;
    if (this.companyInfo.logo) {
      if (this.companyInfo.logo.startsWith('http')) {
        // זה URL - השתמש בו ישירות
        logoUrl = this.companyInfo.logo;
      } else if (fs.existsSync(this.companyInfo.logo)) {
        // זה נתיב מקומי - המר ל-base64
        try {
          const logoBuffer = await fs.readFile(this.companyInfo.logo);
          logoUrl = `data:image/png;base64,${logoBuffer.toString('base64')}`;
        } catch (error) {
          console.log('⚠️ שגיאה בקריאת הלוגו:', error.message);
        }
      }
    }

    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>תעודת משלוח - רדברי</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;700;900&display=swap');
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Heebo', Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #000;
            background: white;
            padding: 15px;
          }
          
          .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 1px solid #000;
            padding-bottom: 15px;
          }
          
          .logo {
            font-size: 32px;
            font-weight: 900;
            color: #d32f2f;
            margin-bottom: 5px;
            letter-spacing: 2px;
          }
          
          .company-logo {
            max-width: 200px;
            max-height: 80px;
            margin: 0 auto 10px;
            display: block;
            object-fit: contain;
          }
          
          .subtitle {
            font-size: 14px;
            color: #666;
            margin-bottom: 15px;
          }
          
          .company-details {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            font-size: 11px;
          }
          
          .company-details > div {
            flex: 1;
          }
          
          .company-details.right {
            text-align: right;
          }
          
          .company-details.left {
            text-align: left;
          }
          
          .company-details p {
            margin-bottom: 3px;
          }
          
          .document-title {
            text-align: right;
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 15px;
            border-bottom: 1px solid #000;
            padding-bottom: 5px;
          }
          
          .recipient-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            font-size: 11px;
          }
          
          .recipient-info > div {
            flex: 1;
          }
          
          .recipient-info.right {
            text-align: right;
          }
          
          .recipient-info.left {
            text-align: left;
          }
          
          .recipient-info p {
            margin-bottom: 3px;
          }
          
          .products-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 10px;
          }
          
          .products-table th,
          .products-table td {
            border: 1px solid #000;
            padding: 8px 4px;
            text-align: center;
            vertical-align: middle;
          }
          
          .products-table th {
            background-color: #f0f0f0;
            font-weight: 700;
            font-size: 11px;
          }
          
          .products-table td {
            font-size: 10px;
          }
          
          .products-table .item-number {
            width: 40px;
          }
          
          .products-table .item-code {
            width: 80px;
          }
          
          .products-table .item-description {
            text-align: right;
            width: 200px;
          }
          
          .products-table .quantity {
            width: 60px;
          }
          
          .products-table .total-vat {
            width: 80px;
          }
          
          .products-table .price-vat {
            width: 80px;
          }
          
          .summary-section {
            margin-bottom: 20px;
            font-size: 11px;
          }
          
          .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            padding: 2px 0;
          }
          
          .summary-row .label {
            font-weight: 500;
          }
          
          .summary-row .value {
            font-weight: 700;
            border-bottom: 1px solid #000;
            min-width: 80px;
            text-align: center;
          }
          
          .terms-section {
            margin-bottom: 20px;
            font-size: 10px;
          }
          
          .terms-section h3 {
            font-size: 12px;
            font-weight: 700;
            margin-bottom: 10px;
            text-align: right;
          }
          
          .terms-list {
            list-style: none;
            padding-right: 0;
          }
          
          .terms-list li {
            margin-bottom: 3px;
            padding-right: 15px;
            position: relative;
          }
          
          .terms-list li:before {
            content: "*";
            position: absolute;
            right: 0;
            color: #000;
          }
          
          .footer-section {
            display: flex;
            justify-content: space-between;
            margin-top: 30px;
            font-size: 10px;
            border-top: 1px solid #000;
            padding-top: 15px;
          }
          
          .footer-section > div {
            flex: 1;
          }
          
          .footer-section .left {
            text-align: left;
          }
          
          .footer-section .right {
            text-align: right;
          }
          
          .signature-line {
            border-bottom: 1px solid #000;
            margin-top: 5px;
            padding-bottom: 2px;
            min-width: 120px;
            display: inline-block;
          }
          
          .digital-seal {
            text-align: center;
            margin: 20px 0;
            font-size: 9px;
            color: #666;
          }
          
          .seal-circle {
            width: 80px;
            height: 80px;
            border: 2px solid #666;
            border-radius: 50%;
            margin: 0 auto 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 8px;
            text-align: center;
            line-height: 1.2;
          }
          
          .ownership-clause {
            text-align: center;
            font-size: 9px;
            margin: 15px 0;
            font-style: italic;
          }
        </style>
      </head>
      <body>
        <div class="header">
          ${logoUrl ? 
            `<img src="${logoUrl}" alt="לוגו רדברי" class="company-logo">` : 
            `<div class="logo">REDBEARY</div>`
          }
        </div>
        
        <div class="company-details">
          <div class="left">
            <p>עוסק מורשה ${this.companyInfo.taxId}</p>
            <p>1 מתוך 1</p>
          </div>
          <div class="right">
            <p>${this.companyInfo.name}</p>
            <p>${this.companyInfo.address}</p>
            <p>טלפון: ${this.companyInfo.phone} פקס: ${this.companyInfo.fax}</p>
          </div>
        </div>
        
        <div class="document-title">תעודת משלוח</div>
        
        <div class="recipient-info">
          <div class="left">
            <p>מקור</p>
            <p>מספר: ${saleData.shipping_number}</p>
            <p>מספרכם: ${saleData.sale_id}</p>
            <p>תאריך: ${new Date().toLocaleDateString('he-IL')}</p>
            <p>שעה: ${new Date().toLocaleTimeString('he-IL', {hour: '2-digit', minute:'2-digit'})}</p>
            <p>דף 1 מתוך 1</p>
            <p>טלפון: ${saleData.customer_phone || 'לא צוין'}</p>
            <p>ע-מ/ת-ז: ${saleData.customer_tax_id || 'לא צוין'}</p>
          </div>
          <div class="right">
            <p>לכבוד:</p>
            <p>${saleData.customer_name}</p>
            <p>${saleData.customer_address}</p>
          </div>
        </div>
        
        <table class="products-table">
          <thead>
            <tr>
              <th class="item-number">#</th>
              <th class="item-code">מס' פריט</th>
              <th class="item-description">תאור פריט</th>
              <th class="quantity">כמות</th>
              <th class="total-vat">סה"כ כולל מע"מ</th>
              <th class="price-vat">ש"ח כולל מע"מ</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item, index) => {
              const quantity = parseFloat(item.quantity) || 0;
              return `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.product_id || 'N/A'}</td>
                  <td class="item-description">${item.product_name}</td>
                  <td>${quantity.toFixed(2)}</td>
                  <td></td>
                  <td></td>
                </tr>
              `;
            }).join('')}
            <tr>
              <td colspan="3" style="text-align: right; font-weight: 700;">סה"כ</td>
              <td style="text-align: center; font-weight: 700; border-bottom: 2px solid #000;">${items.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0).toFixed(2)}</td>
              <td></td>
              <td></td>
            </tr>
          </tbody>
        </table>
        
        <div class="summary-section">
          <div class="summary-row">
            <span class="label">סה"כ כולל מע"מ:</span>
            <span class="value">₪${totalAmount.toFixed(2)}</span>
          </div>
          <div class="summary-row">
            <span class="label">הנחה ${discountRate}%:</span>
            <span class="value">₪${discountAmount.toFixed(2)}</span>
          </div>
          <div class="summary-row">
            <span class="label">סה"כ לתשלום:</span>
            <span class="value">₪${finalAmount.toFixed(2)}</span>
          </div>
        </div>
        
        <div class="terms-section">
          <h3>תנאי המכר:</h3>
          <ul class="terms-list">
            <li>זמן אספקה משוער: 40 ימי עבודה</li>
            <li>אחריות: שנה למוצרים, 10 שנים למזרנים. לא כולל: רהיטי תצוגה, איסוף עצמי, קרעים/חתכים</li>
            <li>סטייה אפשרית של 5% בגודל המוצר</li>
            <li>לא כולל אחריות: מוצרים תלויים (מדפים, בופה, ספרייה)</li>
            <li>אחריות הלקוח: עלות משלוח והרכבה, כולל מנוף אם נדרש</li>
            <li>תשלום מלא לפני אספקת הסחורה</li>
            <li>עיכוב של 10 ימים אינו עילה לביטול</li>
            <li>הקונה מוותר על תביעות קנס/ריבית</li>
            <li>אחריות בלעדית של הלקוח: נתיבי גישה ברורים למשלוח</li>
            <li>החברה לא אחראית לבדיקת בדים; סטיית צבע קלה אפשרית</li>
            <li>אישור הקונה: קבלת הסחורה כהוכחה סופית להתאמת המוצר</li>
            <li>מוצרים בהזמנה מיוחדת (מידות/צבעים מותאמים): לא כפופים לזכויות ביטול לפי תקנות הגנת הצרכן 2010</li>
            <li>הסחורה בבעלות רדברי עד לתשלום מלא</li>
            <li>תשלומי צ'ק כפופים לאישור חברת ביטוח</li>
          </ul>
        </div>
        
        <div class="footer-section">
          <div class="left">
            <p>תאריך תשלום ${new Date().toLocaleDateString('he-IL')}</p>
            <div class="signature-line"></div>
          </div>
          <div class="right">
            <p>שם המקבל</p>
            <div class="signature-line"></div>
            <p>חתימה</p>
            <div class="signature-line"></div>
          </div>
        </div>
        
        <div class="digital-seal">
          <div class="seal-circle">
            🔒<br>
            ממוחשב<br>
            חתום דיגיטלית
          </div>
          <p>תוכנות רווחיות לניהול עסקים</p>
        </div>
        
        <div class="ownership-clause">
          הסחורה בבעלות "${this.companyInfo.name}" עד לפרעון מלא של התשלום.
        </div>
        
        <div class="footer-section">
          <div class="left">
            <p>דף 1 מתוך 1</p>
          </div>
          <div class="right">
            <p>מפיק המסמך: ${this.companyInfo.email}</p>
            <p>${this.companyInfo.name}</p>
          </div>
        </div>
      </body>
      </html>
    `;
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

module.exports = new PDFServicePuppeteer(); 