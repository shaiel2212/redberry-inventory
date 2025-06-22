const pool = require('../config/db');

/**
 * שליפת משלוחים שעדיין לא סופקו
 */
exports.getPendingDeliveries = async (req, res) => {
  try {
    const [deliveries] = await pool.query(`
      SELECT 
        d.id,
        d.sale_id,
        s.customer_name,
        s.address,
        s.total_amount,
        s.sale_date,
        u.username AS seller_name,
        p.name AS product_name,
        p.description AS size,
        si.quantity,
        d.status,
        d.assigned_to,
        d.delivered_at,
        d.delivery_proof_url,
        d.delivery_proof_signed_url
      FROM deliveries d
      JOIN sales s ON d.sale_id = s.id
      JOIN users u ON s.user_id = u.id
      JOIN sale_items si ON si.sale_id = s.id
      JOIN products p ON p.id = si.product_id
      WHERE d.status != 'delivered'
      ORDER BY d.sale_id DESC;
    `);

    res.json(deliveries);
  } catch (err) {
    console.error('Error fetching pending deliveries:', err.message);
    res.status(500).send('Server error');
  }
};

/**
 * סימון משלוח כסופק – רק אם קיימת תעודה חתומה
 */
exports.markAsDelivered = async (req, res) => {
  const deliveryId = req.params.id;

  try {
    const [rows] = await pool.query(
      'SELECT delivery_proof_signed_url FROM deliveries WHERE id = ?',
      [deliveryId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'משלוח לא נמצא' });
    }

    if (!rows[0].delivery_proof_signed_url) {
      return res.status(400).json({
        message: 'לא ניתן לסגור משלוח ללא תעודת משלוח חתומה',
      });
    }

    await pool.query(
      'UPDATE deliveries SET status = ?, delivered_at = NOW() WHERE id = ?',
      ['delivered', deliveryId]
    );

    res.json({ message: 'המשלוח סומן כסופק בהצלחה' });
  } catch (error) {
    console.error('שגיאה בעדכון משלוח כסופק:', error);
    res.status(500).json({ message: 'שגיאה פנימית בשרת' });
  }
};

/**
 * העלאת תעודת משלוח – קובץ אחד בכל פעם, השדה נקבע לפי מצב המשלוח
 */
exports.updateDeliveryProof = async (req, res) => {
  const deliveryId = req.params.id;
  const uploadedByUser = req.user?.id;

  if (!req.file) {
    return res.status(400).json({ message: 'לא התקבל קובץ להעלאה' });
  }

  const fileUrl = req.file.path;

  try {
    const [rows] = await pool.query(
      'SELECT delivery_proof_url, delivery_proof_signed_url FROM deliveries WHERE id = ?',
      [deliveryId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'משלוח לא נמצא' });
    }

    let columnToUpdate;
    if (!rows[0].delivery_proof_url) {
      columnToUpdate = 'delivery_proof_url';
    } else {
      columnToUpdate = 'delivery_proof_signed_url';
    }

    const [result] = await pool.query(
      `UPDATE deliveries SET ${columnToUpdate} = ?, updated_by_user = ? WHERE id = ?`,
      [fileUrl, uploadedByUser, deliveryId]
    );

    res.status(200).json({ message: 'קובץ נשמר בהצלחה', fileUrl, field: columnToUpdate });
  } catch (error) {
    console.error('שגיאה בהעלאת תעודה ל־Cloudinary:', error);
    res.status(500).json({ message: 'שגיאת שרת' });
  }
};
exports.getAllDeliveries = async (req, res) => {
  try {
    const [deliveries] = await pool.query(`
      SELECT 
        d.id,
        d.sale_id,
        s.customer_name,
        s.address,
        s.total_amount,
        s.sale_date,
        u.username AS seller_name,
        p.name AS product_name,
        p.description AS size,
        si.quantity,
        d.status,
        d.assigned_to,
        d.delivered_at,
        d.delivery_proof_url,
        d.delivery_proof_signed_url
      FROM deliveries d
      JOIN sales s ON d.sale_id = s.id
      JOIN users u ON s.user_id = u.id
      JOIN sale_items si ON si.sale_id = s.id
      JOIN products p ON p.id = si.product_id
      ORDER BY d.sale_id DESC;
    `);

    res.json(deliveries);
  } catch (err) {
    console.error('Error fetching all deliveries:', err.message);
    res.status(500).send('Server error');
  }
};

// deliveriesController.js
exports.updateDeliveryStatus = async (req, res) => {
  const deliveryId = parseInt(req.params.id);
  const { status } = req.body;
  const updatedByUserId = req.user?.id;

  const allowedStatuses = ['pending', 'assigned', 'picked_up', 'delivered', 'cancelled'];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: 'סטטוס לא תקין' });
  }

  try {
    const updates = ['status = ?'];
    const values = [status];

    if (status === 'picked_up') {
      updates.push('picked_up_at = NOW()');
    }

    updates.push('updated_by_user = ?');
    values.push(updatedByUserId);

    await pool.query(
      `UPDATE deliveries SET ${updates.join(', ')} WHERE id = ?`,
      [...values, deliveryId]
    );

    res.json({ message: 'סטטוס עודכן בהצלחה' });
  } catch (err) {
    console.error('שגיאה בעדכון סטטוס:', err.message);
    res.status(500).json({ message: 'שגיאה בעדכון סטטוס משלוח' });
  }
};

exports.getDeliveryStatuses = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'deliveries' 
      AND COLUMN_NAME = 'status'
    `);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'לא נמצאה עמודת סטטוס' });
    }

    const columnType = rows[0].COLUMN_TYPE; // enum('pending','assigned',...)
    const statuses = columnType
      .replace(/^enum\(/, '')
      .replace(/\)$/, '')
      .split(',')
      .map(s => s.trim().replace(/^'/, '').replace(/'$/, ''));

    res.json(statuses);
  } catch (err) {
    console.error('Error fetching status enum:', err);
    res.status(500).json({ message: 'שגיאה בשליפת סטטוסים' });
  }
};
