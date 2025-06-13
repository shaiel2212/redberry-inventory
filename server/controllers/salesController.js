const pool = require('../config/db');
const xss = require('xss');

// Create a new sale



// Create a new sale
exports.createSale = async (req, res) => {
  const items = req.body.items.map(item => ({
    product_id: parseInt(item.product_id),
    quantity: parseInt(item.quantity)
  }));

  const total_amount = parseFloat(req.body.total_amount || 0);
  const customer_name = xss(req.body.customer_name || '');
  const userId = req.user?.id; // ודא שזה מגיע מהמזהה המאומת
  const address = xss(req.body.address || '');

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [saleResult] = await connection.query(
      'INSERT INTO sales (total_amount, customer_name, user_id , address) VALUES (?, ?, ?, ?)',
      [total_amount, customer_name, userId,address]
    );

    const saleId = saleResult.insertId;
    await connection.query(
      'INSERT INTO deliveries (sale_id, status, assigned_to, picked_up_at) VALUES (?, ?, ?, ?)',
      [saleId, 'pending', userId, new Date()]
    );
    for (const item of items) {
      // שלוף את המחיר ליחידה מהמוצר
      const [[product]] = await connection.query(
        'SELECT sale_price FROM products WHERE id = ?',
        [item.product_id]
      );

      if (!product) {
        throw new Error(`Product ID ${item.product_id} not found`);
      }

      const pricePerUnit = parseFloat(product.sale_price);

      await connection.query(
        'INSERT INTO sale_items (sale_id, product_id, quantity, price_per_unit) VALUES (?, ?, ?, ?)',
        [saleId, item.product_id, item.quantity, pricePerUnit]
      );

      await connection.query(
        'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ? AND stock_quantity >= ?',
        [item.quantity, item.product_id, item.quantity]
      );
    }

    await connection.commit();
    res.status(201).json({ sale_id: saleId });
  } catch (err) {
    await connection.rollback();
    console.error('Create sale error:', err.message, err.stack);

    res.status(500).send('Error creating sale');
  } finally {
    connection.release();
  }
};


// Get all sales
exports.getAllSales = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        s.id, 
        s.sale_date, 
        s.customer_name, 
        s.total_amount, 
        u.username AS sold_by
      FROM sales s
      LEFT JOIN users u ON s.user_id = u.id
      ORDER BY s.id DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('Get all sales error:', err.message);
    res.status(500).send('Error retrieving sales');
  }
};

// Get a single sale by ID
exports.getSaleById = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const [sales] = await pool.query(`SELECT 
  s.id, 
  s.sale_date, 
  s.customer_name, 
  s.total_amount, 
  u.username AS sold_by
FROM sales s
LEFT JOIN users u ON s.user_id = u.id
WHERE s.id = ?;
`,
      [id]);
    if (sales.length === 0) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    const [items] = await pool.query(
      'SELECT si.product_id, p.name, si.quantity, p.sale_price ' +
      'FROM sale_items si JOIN products p ON si.product_id = p.id WHERE si.sale_id = ?',
      [id]
    );

    res.json({ ...sales[0], items });
  } catch (err) {
    console.error('Get sale by ID error:', err.message);
    res.status(500).send('Error retrieving sale');
  }
};
