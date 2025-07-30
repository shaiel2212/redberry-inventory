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

    const [[client]] = await connection.query('SELECT full_name FROM clients WHERE id = ?', [clientId]);
    const customerName = client?.full_name || 'ללא שם';

    const [saleResult] = await connection.query(
      `INSERT INTO sales (total_amount, user_id, address, client_id, delivery_cost, notes, customer_name, has_unsupplied_items)
       VALUES (?, ?, ?, ?, ?, ?, ?, FALSE)`,
      [total_amount, userId, address, clientId, deliveryCost, notes, customerName]
    );
    const saleId = saleResult.insertId;

    let hasUnsupplied = false;

    for (const item of items) {
      const [[product]] = await connection.query(
        'SELECT sale_price, cost_price, stock_quantity FROM products WHERE id = ?',
        [item.product_id]
      );
      if (!product) throw new Error(`Product ID ${item.product_id} not found`);

      const pricePerUnit = parseFloat(product.sale_price);
      const costPrice = parseFloat(product.cost_price);
      const profitPerItem = pricePerUnit - costPrice;
      const totalProfit = profitPerItem * item.quantity;
      const stockAvailable = parseInt(product.stock_quantity);

      const isSupplied = stockAvailable >= item.quantity;

      // עדכון מלאי – גם אם המלאי יורד למינוס
      await connection.query(
        'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );

      await connection.query(
        `INSERT INTO sale_items (sale_id, product_id, quantity, price_per_unit, cost_price, profit_per_item, total_profit, is_supplied)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [saleId, item.product_id, item.quantity, pricePerUnit, costPrice, profitPerItem, totalProfit, isSupplied]
      );

      if (!isSupplied) {
        hasUnsupplied = true;
        await connection.query(
          `INSERT INTO pending_orders (product_id, quantity, client_id, sale_notes, created_by)
           VALUES (?, ?, ?, ?, ?)`,
          [item.product_id, item.quantity, clientId, notes, userId]
        );
      }
    }

    const deliveryStatus = hasUnsupplied ? 'awaiting_stock' : 'pending';

    await connection.query(
      `INSERT INTO deliveries (sale_id, status, assigned_to, picked_up_at, is_awaiting_stock)
       VALUES (?, ?, ?, ?, ?)`,
      [saleId, deliveryStatus, userId, new Date(), hasUnsupplied]
    );

    if (hasUnsupplied) {
      await connection.query(
        'UPDATE sales SET has_unsupplied_items = TRUE WHERE id = ?',
        [saleId]
      );
    }

    await connection.commit();
    res.status(201).json({
      sale_id: saleId,
      message: hasUnsupplied
        ? 'המכירה בוצעה. חלק מהמוצרים סומנו כלא מסופקים.'
        : 'המכירה בוצעה בהצלחה.'
    });
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
        si.total_profit,
        si.is_supplied
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
      has_unsupplied_items: !!sale.has_unsupplied_items
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

    // עבור כל מכירה נחזיר גם final_amount, total_profit וגם הדגל has_unsupplied_items
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
        has_unsupplied_items: !!sale.has_unsupplied_items // ודא שזה יופיע כתאריך בוליאני
      };
    }));

    res.json(enhancedRows);
  } catch (err) {
    console.error('❌ Get all sales error:', err.message);
    res.status(500).json({ message: 'שגיאה בטעינת רשימת מכירות' });
  }
};

// פונקציה מחזירה enrichedRows לשימוש פנימי/חיצוני
async function getSalesReportData({ clientId, productId, startDate, endDate }) {
  let query = `
    SELECT 
      s.id AS sale_id,
      s.sale_date,
      s.total_amount,
      s.delivery_cost,
      s.discount_percent,
      s.discount_amount,
      s.has_unsupplied_items,
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
    const nextDay = new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    query += ` AND s.sale_date < ?`;
    params.push(nextDay);
  }
  query += ` ORDER BY s.sale_date DESC`;
  const [rows] = await pool.query(query, params);
  // קיבוץ כל הפריטים לכל עסקה
  const salesMap = {};
  rows.forEach(row => {
    if (!salesMap[row.sale_id]) salesMap[row.sale_id] = [];
    salesMap[row.sale_id].push(row);
  });
  const enrichedRows = [];
  Object.values(salesMap).forEach(items => {
    const totalAmount = Number(items[0].total_amount || 0);
    const deliveryCost = Number(items[0].delivery_cost || 0);
    // סכום כל הפריטים (לפני הנחות)
    const totalItemsAmount = items.reduce((sum, item) =>
      sum + (Number(item.price_per_unit) * Number(item.quantity)), 0);
    // חישוב final_amount (אחרי הנחות)
    let finalAmount = totalAmount;
    const baseDiscount = Number(items[0].base_discount_percent || 0);
    const cashDiscount = Number(items[0].cash_discount_percent || 0);
    const extraDiscount = Number(items[0].discount_percent || 0);
    const discountAmount = Number(items[0].discount_amount || 0);
    if (baseDiscount > 0) finalAmount -= finalAmount * (baseDiscount / 100);
    if (cashDiscount > 0) finalAmount -= finalAmount * (cashDiscount / 100);
    if (extraDiscount > 0) finalAmount -= finalAmount * (extraDiscount / 100);
    if (discountAmount > 0) finalAmount -= discountAmount;
    finalAmount = Number(finalAmount.toFixed(2));
    // סה"כ הנחה
    const totalDiscount = totalAmount - finalAmount;
    items.forEach(item => {
      const itemAmount = Number(item.price_per_unit) * Number(item.quantity);
      const itemShare = totalItemsAmount > 0 ? itemAmount / totalItemsAmount : 0;
      const itemDiscount = totalDiscount * itemShare;
      const itemDelivery = deliveryCost * itemShare;
      const costPrice = Number(item.cost_price) || 0;
      const profitPerItem = (Number(item.price_per_unit) - costPrice) * Number(item.quantity);
      const finalProfit = profitPerItem - itemDiscount - itemDelivery;
      enrichedRows.push({
        ...item,
        final_amount: finalAmount,
        final_profit: Number(finalProfit.toFixed(2)),
        item_discount: Number(itemDiscount.toFixed(2)),
        item_delivery: Number(itemDelivery.toFixed(2)),
        has_unsupplied_items: !!item.has_unsupplied_items,
      });
    });
  });
  return enrichedRows;
}

exports.getSalesReportData = getSalesReportData;

exports.getSalesReport = async (req, res) => {
  try {
    const enrichedRows = await getSalesReportData(req.query);
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

exports.getRecentSales = async (req, res) => {
  try {
    const [sales] = await pool.query(`
      SELECT s.id, s.sale_date, c.full_name AS customer_name, s.total_amount, s.notes
      FROM sales s
      LEFT JOIN clients c ON s.client_id = c.id
      ORDER BY s.sale_date DESC
      LIMIT 5
    `);
    res.json(sales);
    console.log(sales);
  } catch (err) {
    console.error('Error fetching recent sales:', err);
    res.status(500).send('Error fetching recent sales');
  }
};


exports.fullEditSale = async (req, res) => {
  const saleId = parseInt(req.params.id, 10);
  const userId = req.user?.id;
  if (isNaN(saleId) || !userId) return res.status(400).json({ message: 'Invalid request' });

  // שליפת המכירה לבדוק סטטוס
  const [[sale]] = await pool.query('SELECT * FROM sales WHERE id = ?', [saleId]);
  if (!sale) return res.status(404).json({ message: 'Sale not found' });
  if (['delivered', 'cancelled'].includes(sale.status)) {
    return res.status(400).json({ message: 'Cannot edit delivered or cancelled sale' });
  }

  const { items, address, notes, delivery_cost, discount_percent } = req.body;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // שלוף את הפריטים הקיימים
    const [oldItems] = await connection.query('SELECT * FROM sale_items WHERE sale_id = ?', [saleId]);

    // 1. מחיקת פריטים שהוסרו (והחזרת מלאי)
    for (const oldItem of oldItems) {
      if (!items.find(i => i.product_id === oldItem.product_id)) {
        await connection.query('UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?', [oldItem.quantity, oldItem.product_id]);
        await connection.query('DELETE FROM sale_items WHERE sale_id = ? AND product_id = ?', [saleId, oldItem.product_id]);
        await connection.query(
          'INSERT INTO sales_edit_history (sale_id, user_id, change_type, field_name, old_value, new_value) VALUES (?, ?, ?, ?, ?, ?)',
          [saleId, userId, 'remove_item', 'product_id', oldItem.product_id, null]
        );
      }
    }

    // 2. עדכון/הוספה של פריטים
    for (const item of items) {
      const [existing] = oldItems.filter(i => i.product_id === item.product_id);
      if (existing) {
        if (existing.quantity !== item.quantity) {
          // עדכון מלאי
          const diff = item.quantity - existing.quantity;
          await connection.query('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?', [diff, item.product_id]);
          await connection.query('UPDATE sale_items SET quantity = ? WHERE sale_id = ? AND product_id = ?', [item.quantity, saleId, item.product_id]);
          await connection.query(
            'INSERT INTO sales_edit_history (sale_id, user_id, change_type, field_name, old_value, new_value) VALUES (?, ?, ?, ?, ?, ?)',
            [saleId, userId, 'update_quantity', 'quantity', existing.quantity, item.quantity]
          );
        }
      } else {
        // הוספת פריט חדש
        await connection.query('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?', [item.quantity, item.product_id]);
        await connection.query(
          'INSERT INTO sale_items (sale_id, product_id, quantity, price_per_unit, cost_price) VALUES (?, ?, ?, ?, ?)',
          [saleId, item.product_id, item.quantity, item.price_per_unit, item.cost]
        );
        await connection.query(
          'INSERT INTO sales_edit_history (sale_id, user_id, change_type, field_name, old_value, new_value) VALUES (?, ?, ?, ?, ?, ?)',
          [saleId, userId, 'add_item', 'product_id', null, item.product_id]
        );
      }
    }

    // 3. עדכון שדות כלליים (כתובת, הערות, עלות משלוח, הנחה, סכומים)
    if (address !== sale.address) {
      await connection.query('UPDATE sales SET address = ? WHERE id = ?', [address, saleId]);
      await connection.query(
        'INSERT INTO sales_edit_history (sale_id, user_id, change_type, field_name, old_value, new_value) VALUES (?, ?, ?, ?, ?, ?)',
        [saleId, userId, 'update_field', 'address', sale.address, address]
      );
    }
    if (notes !== sale.notes) {
      await connection.query('UPDATE sales SET notes = ? WHERE id = ?', [notes, saleId]);
      await connection.query(
        'INSERT INTO sales_edit_history (sale_id, user_id, change_type, field_name, old_value, new_value) VALUES (?, ?, ?, ?, ?, ?)',
        [saleId, userId, 'update_field', 'notes', sale.notes, notes]
      );
    }
    if (delivery_cost !== sale.delivery_cost) {
      await connection.query('UPDATE sales SET delivery_cost = ? WHERE id = ?', [delivery_cost, saleId]);
      await connection.query(
        'INSERT INTO sales_edit_history (sale_id, user_id, change_type, field_name, old_value, new_value) VALUES (?, ?, ?, ?, ?, ?)',
        [saleId, userId, 'update_field', 'delivery_cost', sale.delivery_cost, delivery_cost]
      );
    }
    if (discount_percent !== sale.discount_percent) {
      await connection.query('UPDATE sales SET discount_percent = ? WHERE id = ?', [discount_percent, saleId]);
      await connection.query(
        'INSERT INTO sales_edit_history (sale_id, user_id, change_type, field_name, old_value, new_value) VALUES (?, ?, ?, ?, ?, ?)',
        [saleId, userId, 'update_field', 'discount_percent', sale.discount_percent, discount_percent]
      );
    }
    // עדכון סכומים
    if (req.body.total_amount !== undefined && req.body.total_amount !== sale.total_amount) {
      await connection.query('UPDATE sales SET total_amount = ? WHERE id = ?', [req.body.total_amount, saleId]);
      await connection.query(
        'INSERT INTO sales_edit_history (sale_id, user_id, change_type, field_name, old_value, new_value) VALUES (?, ?, ?, ?, ?, ?)',
        [saleId, userId, 'update_field', 'total_amount', sale.total_amount, req.body.total_amount]
      );
    }


    await connection.commit();
    res.json({ message: 'Sale updated successfully' });
  } catch (err) {
    await connection.rollback();
    console.error('Error editing sale:', err);
    res.status(500).json({ message: 'Error editing sale' });
  } finally {
    connection.release();
  }
};

exports.getSaleEditHistory = async (req, res) => {
  const saleId = parseInt(req.params.id, 10);
  if (isNaN(saleId)) return res.status(400).json({ message: 'Invalid sale id' });

  try {
    const [rows] = await pool.query(
      `SELECT h.*, u.username 
       FROM sales_edit_history h
       JOIN users u ON h.user_id = u.id
       WHERE h.sale_id = ?
       ORDER BY h.changed_at DESC`,
      [saleId]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching sale edit history:', err);
    res.status(500).json({ message: 'Error fetching history' });
  }
};

exports.deleteSale = async (req, res) => {
  const saleId = req.params.id;
  console.log('🗑️ Attempting to delete sale ID:', saleId);
  console.log('👤 User:', req.user);
  
  const conn = await pool.getConnection();
  try {
    console.log('🔗 Database connection established');
    
    // בדוק אם המכירה קיימת
    const [[sale]] = await conn.query('SELECT id FROM sales WHERE id = ?', [saleId]);
    if (!sale) {
      console.log('❌ Sale not found:', saleId);
      return res.status(404).json({ message: 'המכירה לא נמצאה' });
    }
    console.log('✅ Sale found:', saleId);
    
    await conn.beginTransaction();
    console.log('🔄 Transaction started');

    // שלוף את כל הפריטים במכירה
    const [items] = await conn.query('SELECT product_id, quantity FROM sale_items WHERE sale_id = ?', [saleId]);
    console.log('📦 Found items to restore:', items.length);

    // החזר מלאי לכל מוצר
    for (const item of items) {
      console.log(`🔄 Restoring ${item.quantity} units to product ${item.product_id}`);
      await conn.query('UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?', [item.quantity, item.product_id]);
    }

    // מחק את היסטוריית העריכות (חדש!)
    console.log('🗑️ Deleting sales edit history');
    await conn.query('DELETE FROM sales_edit_history WHERE sale_id = ?', [saleId]);

    // מחק את הפריטים
    console.log('🗑️ Deleting sale items');
    await conn.query('DELETE FROM sale_items WHERE sale_id = ?', [saleId]);
    
    // מחק משלוחים
    console.log('🗑️ Deleting deliveries');
    await conn.query('DELETE FROM deliveries WHERE sale_id = ?', [saleId]);
    
    // מחק את המכירה
    console.log('🗑️ Deleting sale');
    const [deleteResult] = await conn.query('DELETE FROM sales WHERE id = ?', [saleId]);
    console.log('✅ Sale deleted, rows affected:', deleteResult.affectedRows);

    await conn.commit();
    console.log('✅ Transaction committed successfully');
    res.json({ message: 'המכירה נמחקה בהצלחה' });
  } catch (err) {
    await conn.rollback();
    console.error('❌ Error deleting sale:', err);
    console.error('❌ Error stack:', err.stack);
    res.status(500).json({ message: 'שגיאה במחיקת מכירה', error: err.message });
  } finally {
    conn.release();
    console.log('🔗 Database connection released');
  }
};