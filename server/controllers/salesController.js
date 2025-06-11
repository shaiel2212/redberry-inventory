exports.createSale = async (req, res) => {
  const items = req.body.items.map(item => ({
    product_id: parseInt(item.product_id),
    quantity: parseInt(item.quantity)
  }));

  const total_amount = parseFloat(req.body.total_amount || 0);
  const customer_name = xss(req.body.customer_name || '');

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // עדכון לפי המבנה החדש – אין payment_method / discount
    const [saleResult] = await connection.query(
      'INSERT INTO sales (total_amount, customer_name) VALUES (?, ?)',
      [total_amount, customer_name]
    );
    const saleId = saleResult.insertId;

    for (const item of items) {
      // שלב 1: נשלוף את מחיר היחידה מהמוצר
      const [productRows] = await connection.query(
        'SELECT sale_price, stock_quantity FROM products WHERE id = ?',
        [item.product_id]
      );
      if (!productRows.length) {
        throw new Error(`Product ID ${item.product_id} not found`);
      }
      if (productRows[0].stock_quantity < item.quantity) {
        throw new Error(`Not enough stock for product ID ${item.product_id}`);
      }

      const unitPrice = productRows[0].sale_price;

      // שלב 2: הכנסת פריט למכירה
      await connection.query(
        'INSERT INTO sale_items (sale_id, product_id, quantity, price_per_unit) VALUES (?, ?, ?, ?)',
        [saleId, item.product_id, item.quantity, unitPrice]
      );

      // שלב 3: עדכון המלאי
      await connection.query(
        'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    await connection.commit();
    res.status(201).json({ sale_id: saleId });
  } catch (err) {
    await connection.rollback();
    console.error('❌ Create sale error:', err.message);
    res.status(500).send('Error creating sale');
  } finally {
    connection.release();
  }
};