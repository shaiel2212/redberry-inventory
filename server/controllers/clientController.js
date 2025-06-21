const  pool  = require('../config/db');

exports.createClient = async (req, res) => {
  const { full_name, base_discount_percent = 0, cash_discount_percent = 0 } = req.body;

  try {
    const [result] = await pool.query(
      `INSERT INTO clients (full_name, base_discount_percent, cash_discount_percent)
       VALUES (?, ?, ?)`,
      [full_name, base_discount_percent, cash_discount_percent]
    );

    res.status(201).json({ id: result.insertId, full_name, base_discount_percent, cash_discount_percent });
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ error: 'Server error while creating client' });
  }
};

exports.getAllClients = async (req, res) => {
  try {
    const [clients] = await pool.query('SELECT * FROM clients ORDER BY full_name ASC');
    res.status(200).json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
};
