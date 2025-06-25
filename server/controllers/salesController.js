// salesController.js - גרסה מלאה ומעודכנת כולל כל הפונקציות

const pool = require('../config/db');
const xss = require('xss');
const path = require('path');
const fs = require('fs');


const calculateFinalAmount = (sale) => {
  let final = parseFloat(sale.total_amount || 0);
  if (sale.base_discount_percent && sale.base_discount_percent > 0) {
    final -= final * (sale.base_discount_percent / 100);
  }
  if (sale.cash_discount_percent && sale.cash_discount_percent > 0) {
    final -= final * (sale.cash_discount_percent / 100);
  }
  if (sale.discount_percent && sale.discount_percent > 0) {
    final -= final * (sale.discount_percent / 100);
  }
  if (sale.discount_amount && sale.discount_amount > 0) {
    final -= parseFloat(sale.discount_amount);
  }
  return Number(final.toFixed(2));
};

exports.createSale = async (req, res) => {
  const items = req.body.items.map(item => ({
    product_id: parseInt(item.product_id),
    quantity: parseInt(item.quantity)
  }));
  const total_amount = parseFloat(req.body.total_amount || 0);
  const clientId = parseInt(req.body.client_id);
  const address = xss(req.body.address || '');
  const userId = req.user?.id;
  const deliveryCost = parseFloat(req.body.delivery_cost || 0);
  const notes = req.body.notes?.trim() || null;

  if (!total_amount || isNaN(total_amount)) return res.status(400).json({ message: 'סכום לא תקין' });
  if (!userId || isNaN(userId)) return res.status(400).json({ message: 'מזהה משתמש שגוי' });
  if (!clientId || isNaN(clientId)) return res.status(400).json({ message: 'מזהה לקוח שגוי' });
  if (!address) return res.status(400).json({ message: 'כתובת חסרה' });

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 🧠 שליפת שם הלקוח
    const [[client]] = await connection.query(
      'SELECT full_name FROM clients WHERE id = ?',
      [clientId]
    );
    const customerName = client?.full_name || 'ללא שם';

    // 💾 הכנסת המכירה עם שם הלקוח
    const [saleResult] = await connection.query(
      `INSERT INTO sales (total_amount, user_id, address, client_id, delivery_cost, notes, customer_name)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [total_amount, userId, address, clientId, deliveryCost, notes, customerName]
    );
    const saleId = saleResult.insertId;

    await connection.query(
      'INSERT INTO deliveries (sale_id, status, assigned_to, picked_up_at) VALUES (?, ?, ?, ?)',
      [saleId, 'pending', userId, new Date()]
    );

    for (const item of items) {
      const [[product]] = await connection.query(
        'SELECT sale_price, cost_price FROM products WHERE id = ?',
        [item.product_id]
      );
      if (!product) throw new Error(`Product ID ${item.product_id} not found`);

      const pricePerUnit = parseFloat(product.sale_price);
      const costPrice = parseFloat(product.cost_price);
      const profitPerItem = pricePerUnit - costPrice;
      const totalProfit = profitPerItem * item.quantity;

      await connection.query(
        `INSERT INTO sale_items (sale_id, product_id, quantity, price_per_unit, cost_price, profit_per_item, total_profit)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [saleId, item.product_id, item.quantity, pricePerUnit, costPrice, profitPerItem, totalProfit]
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
    console.error('❌ Error creating sale:', err);
    res.status(500).send('Error creating sale');
  } finally {
    connection.release();
  }
};

exports.getSaleById = async (req, res) => {
  const saleId = parseInt(req.params.id, 10);
  if (isNaN(saleId)) return res.status(400).json({ message: 'מזהה מכירה שגוי' });

  const user = req.user;

  try {
    const [sales] = await pool.query(`
      SELECT 
        s.*, 
        c.full_name AS customer_name, 
        c.base_discount_percent, 
        c.cash_discount_percent, 
        u.username AS sold_by,
        admin.username AS discount_given_by
      FROM sales s
      LEFT JOIN clients c ON s.client_id = c.id
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN users admin ON s.discount_given_by = admin.id
      WHERE s.id = ?
    `, [saleId]);

    if (sales.length === 0) return res.status(404).json({ message: 'Sale not found' });

    const sale = sales[0];
    const final_amount = calculateFinalAmount(sale);

    if (user.role !== 'admin' && sale.user_id !== user.id) {
      return res.status(403).json({ message: 'אין הרשאה לצפות במכירה זו' });
    }

    const [items] = await pool.query(`
      SELECT 
        si.product_id, 
        p.name AS product_name, 
        si.quantity, 
        si.price_per_unit, 
        si.cost_price, 
        si.total_profit
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      WHERE si.sale_id = ?
    `, [saleId]);

    const total_product_profit = items.reduce((sum, item) => sum + (item.total_profit || 0), 0);
    const delivery_cost = parseFloat(sale.delivery_cost || 0);
    const total_profit = Number((total_product_profit - delivery_cost).toFixed(2));

    res.json({
      ...sale,
      items,
      final_amount,
      delivery_cost,
      total_product_profit,
      total_profit,
    });

  } catch (err) {
    console.error('❌ Get sale by ID error:', err);
    res.status(500).send('Error retrieving sale');
  }
};

exports.getSalesForCurrentSeller = async (req, res) => {
  const sellerId = req.user?.id;
  if (!sellerId || isNaN(sellerId)) return res.status(400).json({ message: 'מזהה משתמש שגוי' });
  try {
    const [rows] = await pool.query(`
      SELECT s.id, c.full_name AS customer_name, s.sale_date, s.total_amount, s.notes
      FROM sales s
      LEFT JOIN clients c ON s.client_id = c.id
      WHERE s.user_id = ?
      ORDER BY s.sale_date DESC
    `, [sellerId]);

    res.json(rows);
  } catch (err) {
    console.error('❌ Error fetching seller sales:', err);
    res.status(500).json({ message: 'שגיאה בשליפת מכירות למוכר' });
  }
};

exports.updateSaleDiscount = async (req, res) => {
  const { discount_type, discount_value } = req.body;
  const saleId = parseInt(req.params.id, 10);
  const updatedByUser = req.user?.id;

  if (!['percent', 'amount'].includes(discount_type)) return res.status(400).json({ message: 'סוג הנחה לא תקין' });
  if (isNaN(discount_value) || discount_value < 0) return res.status(400).json({ message: 'ערך הנחה לא חוקי' });

  const discountPercent = discount_type === 'percent' ? discount_value : null;
  const discountAmount = discount_type === 'amount' ? discount_value : null;

  try {
    await pool.query(`
      UPDATE sales 
      SET discount_percent = ?, discount_amount = ?, discount_given_by = ?, discount_given_at = NOW()
      WHERE id = ?
    `, [discountPercent, discountAmount, updatedByUser, saleId]);

    const [updatedSales] = await pool.query(`
      SELECT s.*, c.full_name AS customer_name, c.base_discount_percent, c.cash_discount_percent, u.username AS sold_by,
             admin.username AS discount_given_by
      FROM sales s
      LEFT JOIN clients c ON s.client_id = c.id
      LEFT JOIN users u ON s.id = u.id
      LEFT JOIN users admin ON s.discount_given_by = admin.id
      WHERE s.id = ?
    `, [saleId]);

    const updatedSale = updatedSales[0];
    const final_amount = calculateFinalAmount(updatedSale);

    res.json({ ...updatedSale, final_amount });
  } catch (err) {
    console.error('❌ Error updating discount:', err);
    res.status(500).json({ message: 'שגיאה בעדכון הנחה' });
  }
};

exports.getAllSales = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        s.*, 
        c.full_name AS customer_name,
        c.base_discount_percent,
        c.cash_discount_percent,
        u.username AS sold_by,
        admin.username AS discount_given_by
      FROM sales s
      LEFT JOIN clients c ON s.client_id = c.id
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN users admin ON s.discount_given_by = admin.id
      ORDER BY s.sale_date DESC
    `);

    // עבור כל מכירה נחזיר גם את final_amount וגם total_profit
    const enhancedRows = await Promise.all(rows.map(async (sale) => {
      const [profitResult] = await pool.query(
        `SELECT SUM(total_profit) AS total FROM sale_items WHERE sale_id = ?`,
        [sale.id]
      );

      const productProfit = profitResult[0]?.total || 0;
      const deliveryCost = sale.delivery_cost || 0;

      return {
        ...sale,
        final_amount: calculateFinalAmount(sale),
        total_profit: Number((productProfit - deliveryCost).toFixed(2)),
      };
    }));

    res.json(enhancedRows);
  } catch (err) {
    console.error('❌ Get all sales error:', err.message);
    res.status(500).json({ message: 'שגיאה בטעינת רשימת מכירות' });
  }
};

exports.getSalesReport = async (req, res) => {
  const { clientId, productId, startDate, endDate } = req.query;

  let query = `
    SELECT 
      s.id AS sale_id,
      s.sale_date,
      s.total_amount,
      s.delivery_cost,
      s.discount_percent,
      s.discount_amount,
      s.notes,
      c.full_name AS customer_name,
      c.base_discount_percent,
      c.cash_discount_percent,
      u.username AS sold_by,
      si.product_id,
      p.name AS product_name,
      si.quantity,
      si.price_per_unit,
      si.cost_price
    FROM sales s
    LEFT JOIN sale_items si ON s.id = si.sale_id
    LEFT JOIN products p ON si.product_id = p.id
    LEFT JOIN users u ON s.user_id = u.id
    LEFT JOIN clients c ON s.client_id = c.id
    WHERE 1 = 1
  `;

  const params = [];

  if (clientId) {
    query += ` AND s.client_id = ?`;
    params.push(clientId);
  }
  if (productId) {
    query += ` AND si.product_id = ?`;
    params.push(productId);
  }
  if (startDate) {
    query += ` AND s.sale_date >= ?`;
    params.push(startDate);
  }
  if (endDate) {
    query += ` AND s.sale_date <= ?`;
    params.push(endDate);
  }
  if (startDate) {
    query += ` AND s.sale_date >= ?`;
    params.push(startDate);
  }

  if (endDate) {
    query += ` AND s.sale_date < ?`;
    const nextDay = new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    params.push(nextDay);
  }

  query += ` ORDER BY s.sale_date DESC`;

  try {
    const [rows] = await pool.query(query, params);

    const enrichedRows = rows.map(row => {
      const totalAmount = Number(row.total_amount) || 0;
      const quantity = Number(row.quantity) || 1;
      const deliveryCost = Number(row.delivery_cost) || 0;
      const costPrice = Number(row.cost_price) || 0;

      const baseDiscount = Number(row.base_discount_percent || 0);
      const cashDiscount = Number(row.cash_discount_percent || 0);
      const extraDiscount = Number(row.discount_percent || 0);
      const discountAmount = Number(row.discount_amount || 0);

      // חישוב מחיר סופי אחרי כל ההנחות
      let finalAmount = totalAmount;
      if (baseDiscount > 0) finalAmount -= finalAmount * (baseDiscount / 100);
      if (cashDiscount > 0) finalAmount -= finalAmount * (cashDiscount / 100);
      if (extraDiscount > 0) finalAmount -= finalAmount * (extraDiscount / 100);
      if (discountAmount > 0) finalAmount -= discountAmount;
      finalAmount = Number(finalAmount.toFixed(2));

      // רווח פריט = מחיר לאחר הנחות פחות עלות מוצר פחות משלוח
      const totalCost = costPrice * quantity;
      const finalProfit = Number((finalAmount - totalCost - deliveryCost).toFixed(2));

      return {
        ...row,
        final_amount: finalAmount,
        final_profit: finalProfit,
      };
    });

    res.json(enrichedRows);
  } catch (err) {
    console.error('❌ Error generating report:', err);
    res.status(500).json({ message: 'שגיאה בשליפת דוח מכירות' });
  }
};

exports.updateSaleDetails = async (req, res) => {
  const saleId = parseInt(req.params.id);
  const { discount_type, discount_value, delivery_cost } = req.body;

  if (isNaN(saleId)) {
    return res.status(400).json({ message: 'מזהה מכירה שגוי' });
  }

  const updates = [];
  const values = [];

  if (discount_type && discount_value !== undefined) {
    if (discount_type === 'percent') {
      updates.push('discount_percent = ?');
    } else if (discount_type === 'amount') {
      updates.push('discount_amount = ?');
    } else {
      return res.status(400).json({ message: 'סוג הנחה לא חוקי' });
    }
    values.push(discount_value);
    updates.push('discount_given_at = NOW()');
    updates.push('discount_given_by = ?');
    values.push(req.user.id);
  }

  if (delivery_cost !== undefined) {
    updates.push('delivery_cost = ?');
    values.push(delivery_cost);
  }

  if (updates.length === 0) {
    return res.status(400).json({ message: 'אין שדות לעדכן' });
  }

  try {
    await pool.query(
      `UPDATE sales SET ${updates.join(', ')} WHERE id = ?`,
      [...values, saleId]
    );
    return res.status(200).json({ message: 'עודכן בהצלחה' });
  } catch (err) {
    console.error('שגיאה בעדכון פרטי מכירה:', err);
    return res.status(500).json({ message: 'שגיאה בעדכון פרטי מכירה' });
  }
};
