const pool = require('../config/db');

class ShippingNoteModel {
  // יצירת תעודת משלוח חדשה
  static async create(shippingData) {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.query(
        `INSERT INTO shipping_notes (
          sale_id, 
          shipping_number, 
          customer_name, 
          customer_address, 
          customer_phone, 
          customer_email,
          total_amount,
          status,
          created_at,
          pdf_path,
          error_message
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)`,
        [
          shippingData.sale_id,
          shippingData.shipping_number,
          shippingData.customer_name,
          shippingData.customer_address,
          shippingData.customer_phone,
          shippingData.customer_email,
          shippingData.total_amount,
          shippingData.status || 'pending',
          shippingData.pdf_path || null,
          shippingData.error_message || null
        ]
      );
      return result.insertId;
    } finally {
      connection.release();
    }
  }

  // עדכון סטטוס תעודת משלוח
  static async updateStatus(shippingNoteId, status, errorMessage = null) {
    const connection = await pool.getConnection();
    try {
      await connection.query(
        `UPDATE shipping_notes SET 
          status = ?, 
          error_message = ?,
          updated_at = NOW()
         WHERE id = ?`,
        [status, errorMessage, shippingNoteId]
      );
      return true;
    } finally {
      connection.release();
    }
  }

  // עדכון נתיב קובץ PDF
  static async updatePdfPath(shippingNoteId, pdfPath) {
    const connection = await pool.getConnection();
    try {
      await connection.query(
        `UPDATE shipping_notes SET 
          pdf_path = ?,
          updated_at = NOW()
         WHERE id = ?`,
        [pdfPath, shippingNoteId]
      );
      return true;
    } finally {
      connection.release();
    }
  }

  // קבלת תעודת משלוח לפי מזהה מכירה
  static async getBySaleId(saleId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT * FROM shipping_notes WHERE sale_id = ? ORDER BY created_at DESC LIMIT 1`,
        [saleId]
      );
      return rows[0] || null;
    } finally {
      connection.release();
    }
  }

  // קבלת תעודת משלוח לפי מזהה
  static async getById(id) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT * FROM shipping_notes WHERE id = ?`,
        [id]
      );
      return rows[0] || null;
    } finally {
      connection.release();
    }
  }

  // קבלת כל תעודות המשלוח עם שגיאות
  static async getWithErrors() {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT sn.*, s.sale_date, c.full_name as customer_name
         FROM shipping_notes sn
         JOIN sales s ON sn.sale_id = s.id
         JOIN clients c ON s.client_id = c.id
         WHERE sn.status = 'error'
         ORDER BY sn.created_at DESC`
      );
      return rows;
    } finally {
      connection.release();
    }
  }

  // קבלת מספר תעודת המשלוח הבאה
  static async getNextShippingNumber() {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT MAX(CAST(SUBSTRING(shipping_number, 3) AS UNSIGNED)) as last_number
         FROM shipping_notes 
         WHERE shipping_number LIKE 'SN%'`
      );
      const lastNumber = rows[0]?.last_number || 0;
      return `SN${String(lastNumber + 1).padStart(6, '0')}`;
    } finally {
      connection.release();
    }
  }
}

module.exports = ShippingNoteModel; 