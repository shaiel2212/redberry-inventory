const pool = require('../config/db');

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
    d.delivery_proof_signed_url  -- ⬅️ הוסף שדה זה!
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

exports.markAsDelivered = async (req, res) => {
  const deliveryId = req.params.id;

  try {
    // שלוף את רשומת המשלוח ממסד הנתונים
    const [rows] = await pool.query(
      'SELECT delivery_proof_signed_url FROM deliveries WHERE id = ?',
      [deliveryId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'משלוח לא נמצא' });
    }

    const delivery = rows[0];

    // בדוק אם קיימת תעודה חתומה
    if (!delivery.delivery_proof_signed_url) {
      return res.status(400).json({
        message: 'לא ניתן לסגור משלוח ללא תעודת משלוח חתומה',
      });
    }

    // עדכן את הסטטוס ל־delivered
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


exports.updateDeliveryProof = async (req, res) => {
  const deliveryId = req.params.id;
  const proofType = req.body.type || req.query.type || 'unsigned'; // ברירת מחדל

  if (!req.file) {
    return res.status(400).json({ message: 'נדרש קובץ להעלאה' });
  }

  const fileUrl = `/uploads/${req.file.filename}`;

  let column;
  if (proofType === 'signed') column = 'delivery_proof_signed_url';
  else if (proofType === 'unsigned' || proofType === 'initial') column = 'delivery_proof_url';
  else return res.status(400).json({ message: 'ערך type לא חוקי' });

  try {
    const [result] = await pool.query(
      `UPDATE deliveries SET ${column} = ?, updated_by_user = ? WHERE id = ?`,
      [fileUrl, req.user?.id || null, deliveryId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'משלוח לא נמצא' });
    }

    res.status(200).json({ message: 'התעודה הועלתה בהצלחה', fileUrl });
  } catch (error) {
    console.error('שגיאה בהעלאת תעודה:', error);
    res.status(500).json({ message: 'שגיאת שרת' });
  }
};