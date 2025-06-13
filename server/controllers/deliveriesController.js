const pool = require('../config/db');

exports.getPendingDeliveries = async (req, res) => {
  try {
    const [deliveries] = await pool.query(`
      SELECT 
        d.id, s.customer_name, s.total_amount, s.sale_date,
        u.username AS seller_name,
        p.name AS product_name,
        p.description AS size,
        si.quantity,
        d.status, d.assigned_to, d.delivered_at
      FROM deliveries d
      JOIN sales s ON d.sale_id = s.id
      JOIN users u ON s.user_id = u.id
      JOIN sale_items si ON si.sale_id = s.id
      JOIN products p ON p.id = si.product_id
      WHERE d.status != 'delivered'
      ORDER BY d.sale_id DESC
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
    await pool.query(`
      UPDATE deliveries
      SET status = 'delivered', delivered_at = NOW()
      WHERE id = ?
    `, [deliveryId]);

    res.json({ message: 'Delivery marked as delivered' });
  } catch (err) {
    console.error('Delivery update error:', err.message);
    res.status(500).send('Server error');
  }
};