const pool = require('../config/db');

class InvoiceModel {
  // יצירת חשבונית חדשה
  static async create(invoiceData) {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.query(
        `INSERT INTO invoices (
          sale_id, 
          invoice_number, 
          customer_name, 
          customer_address, 
          customer_phone, 
          customer_email,
          customer_tax_id,
          total_amount,
          vat_amount,
          final_amount,
          status,
          created_at,
          pdf_path,
          error_message
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)`,
        [
          invoiceData.sale_id,
          invoiceData.invoice_number,
          invoiceData.customer_name,
          invoiceData.customer_address,
          invoiceData.customer_phone,
          invoiceData.customer_email,
          invoiceData.customer_tax_id || null,
          invoiceData.total_amount,
          invoiceData.vat_amount,
          invoiceData.final_amount,
          invoiceData.status || 'pending',
          invoiceData.pdf_path || null,
          invoiceData.error_message || null
        ]
      );
      return result.insertId;
    } finally {
      connection.release();
    }
  }

  // עדכון סטטוס חשבונית
  static async updateStatus(invoiceId, status, errorMessage = null) {
    const connection = await pool.getConnection();
    try {
      await connection.query(
        `UPDATE invoices SET 
          status = ?, 
          error_message = ?,
          updated_at = NOW()
         WHERE id = ?`,
        [status, errorMessage, invoiceId]
      );
      return true;
    } finally {
      connection.release();
    }
  }

  // עדכון נתיב קובץ PDF
  static async updatePdfPath(invoiceId, pdfPath) {
    const connection = await pool.getConnection();
    try {
      await connection.query(
        `UPDATE invoices SET 
          pdf_path = ?,
          updated_at = NOW()
         WHERE id = ?`,
        [pdfPath, invoiceId]
      );
      return true;
    } finally {
      connection.release();
    }
  }

  // קבלת חשבונית לפי מזהה מכירה
  static async getBySaleId(saleId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT * FROM invoices WHERE sale_id = ? ORDER BY created_at DESC LIMIT 1`,
        [saleId]
      );
      return rows[0] || null;
    } finally {
      connection.release();
    }
  }

  // קבלת חשבונית לפי מזהה
  static async getById(id) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT * FROM invoices WHERE id = ?`,
        [id]
      );
      return rows[0] || null;
    } finally {
      connection.release();
    }
  }

  // קבלת כל החשבוניות עם שגיאות
  static async getWithErrors() {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT i.*, s.sale_date, c.full_name as customer_name
         FROM invoices i
         JOIN sales s ON i.sale_id = s.id
         JOIN clients c ON s.client_id = c.id
         WHERE i.status = 'error'
         ORDER BY i.created_at DESC`
      );
      return rows;
    } finally {
      connection.release();
    }
  }

  // קבלת מספר החשבונית הבא
  static async getNextInvoiceNumber() {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT MAX(CAST(SUBSTRING(invoice_number, 2) AS UNSIGNED)) as last_number
         FROM invoices 
         WHERE invoice_number LIKE 'I%'`
      );
      const lastNumber = rows[0]?.last_number || 0;
      return `I${String(lastNumber + 1).padStart(6, '0')}`;
    } finally {
      connection.release();
    }
  }
}

module.exports = InvoiceModel; 