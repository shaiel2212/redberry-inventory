const pool = require('../config/db');
const xss = require('xss');

// Create Product
exports.createProduct = async (req, res) => {
  const name = xss(req.body.name);
  const description = xss(req.body.description || '');
  const category = xss(req.body.category || '');
  const supplier = xss(req.body.supplier || '');
  const image_url = xss(req.body.image_url || '');
  const cost_price = parseFloat(req.body.cost_price);
  const sale_price = parseFloat(req.body.sale_price);
  const stock_quantity = parseInt(req.body.stock_quantity);

  try {
    const [result] = await pool.query(
      'INSERT INTO products (name, description, category, supplier, image_url, cost_price, sale_price, stock_quantity) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, description, category, supplier, image_url, cost_price, sale_price, stock_quantity]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error('Create product error:', err.message);
    res.status(500).send('Server error during product creation');
  }
};

// Get All Products
exports.getAllProducts = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products ORDER BY name');
    res.json(rows);
  } catch (err) {
    console.error('Get all products error:', err.message);
    res.status(500).send('Error retrieving products');
  }
};

// Get Product by ID
exports.getProductById = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Get product by ID error:', err.message);
    res.status(500).send('Error retrieving product');
  }
};

// Update Product
exports.updateProduct = async (req, res) => {
  const id = parseInt(req.params.id);
  const name = xss(req.body.name);
  const description = xss(req.body.description || '');
  const category = xss(req.body.category || '');
  const supplier = xss(req.body.supplier || '');
  const image_url = xss(req.body.image_url || '');
  const cost_price = parseFloat(req.body.cost_price);
  const sale_price = parseFloat(req.body.sale_price);
  const stock_quantity = parseInt(req.body.stock_quantity);

  try {
    await pool.query(
      'UPDATE products SET name = ?, description = ?, category = ?, supplier = ?, image_url = ?, cost_price = ?, sale_price = ?, stock_quantity = ? WHERE id = ?',
      [name, description, category, supplier, image_url, cost_price, sale_price, stock_quantity, id]
    );
    res.sendStatus(204);
  } catch (err) {
    console.error('Update product error:', err.message);
    res.status(500).send('Error updating product');
  }
};

// Delete Product
exports.deleteProduct = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await pool.query('DELETE FROM products WHERE id = ?', [id]);
    res.sendStatus(204);
  } catch (err) {
    console.error('Delete product error:', err.message);
    res.status(500).send('Error deleting product');
  }
};

// Update Stock Quantity
exports.updateStock = async (req, res) => {
  const id = parseInt(req.params.id);
  const stock_quantity = parseInt(req.body.stock_quantity);

  try {
    await pool.query('UPDATE products SET stock_quantity = ? WHERE id = ?', [stock_quantity, id]);
    res.sendStatus(204);
  } catch (err) {
    console.error('Update stock error:', err.message);
    res.status(500).send('Error updating stock quantity');
  }
};
