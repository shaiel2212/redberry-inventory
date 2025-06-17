const pool = require('../config/db');
const xss = require('xss');
const path = require('path');
const fs = require('fs');

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
  const now = new Date();
  const israelTime = new Date(now.getTime() + (3 * 60 * 60 * 1000)); // UTC+3
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [saleResult] = await connection.query(
      'INSERT INTO sales (total_amount, customer_name, user_id , address) VALUES (?, ?, ?, ?)',
      [total_amount, customer_name, userId, address, israelTime]
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
  const saleId = parseInt(req.params.id, 10);

  if (isNaN(saleId)) {
    console.warn('⚠️ מזהה מכירה לא חוקי:', req.params.id);
    return res.status(400).json({ message: 'מזהה מכירה שגוי' });
  }

  const user = req.user;

  try {
    const [sales] = await pool.query(`
      SELECT 
        s.id, 
        s.sale_date, 
        s.customer_name, 
        s.total_amount, 
        s.user_id,
        u.username AS sold_by
      FROM sales s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `, [saleId]);

    if (sales.length === 0) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    const sale = sales[0];

    if (user.role !== 'admin' && sale.user_id !== user.id) {
      return res.status(403).json({ message: 'אין הרשאה לצפות במכירה זו' });
    }

    const [items] = await pool.query(`
      SELECT si.product_id, p.name, si.quantity, p.sale_price
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      WHERE si.sale_id = ?
    `, [saleId]);

    res.json({ ...sale, items });

  } catch (err) {
    console.error('❌ Get sale by ID error:', err.message, err.stack);
    res.status(500).send('Error retrieving sale');
  }
};
exports.getSalesForCurrentSeller = async (req, res) => {
  try {
    const sellerId = req.user?.id;
    if (!sellerId || isNaN(sellerId)) {
      console.warn('⚠️ Missing or invalid seller ID:', sellerId);
      return res.status(400).json({ message: 'מזהה משתמש חסר או שגוי' });
    }
    const [rows] = await pool.query(`
      SELECT s.id, s.customer_name, s.sale_date, s.total_amount
      FROM sales s
      WHERE s.user_id = ?
      ORDER BY s.sale_date DESC
    `, [sellerId]);

    res.json(rows);
  } catch (err) {
    console.error('❌ Error fetching sales for seller:', err);
    res.status(500).json({ message: 'שגיאה בשליפת מכירות למוכר.' });
  }
};

