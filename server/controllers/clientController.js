const  pool  = require('../config/db');

exports.createClient = async (req, res) => {
  const { full_name, base_discount_percent = 0, cash_discount_percent = 0, phone = '', email = '', billing_day = '' } = req.body;

  console.log('📋 Creating client with data:', {
    full_name,
    base_discount_percent,
    cash_discount_percent,
    phone,
    email,
    billing_day
  });

  try {
    const [result] = await pool.query(
      `INSERT INTO clients (full_name, base_discount_percent, cash_discount_percent, phone, email, billing_day)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [full_name, base_discount_percent, cash_discount_percent, phone, email, billing_day]
    );

    console.log('✅ Client created successfully with ID:', result.insertId);

    res.status(201).json({ 
      id: result.insertId, 
      full_name, 
      base_discount_percent, 
      cash_discount_percent, 
      phone, 
      email, 
      billing_day 
    });
  } catch (error) {
    console.error('❌ Error creating client:', error);
    res.status(500).json({ error: 'Server error while creating client' });
  }
};

exports.getAllClients = async (req, res) => {
  try {
    const [clients] = await pool.query('SELECT * FROM clients ORDER BY full_name ASC');
    console.log('📋 Fetched clients:', clients.length, 'clients');
    console.log('📋 Sample client data:', clients[0]);
    res.status(200).json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
};

exports.getClientsForBillingReminder = async (req, res) => {
  try {
    const today = new Date();
    const day = today.getDate();
    const tomorrow = (day % 31) + 1; // גלגול ל-1 אחרי 31

    const [clients ]= await pool.query(
      'SELECT * FROM clients WHERE billing_day IN (?, ?)',
      [day, tomorrow]
    );
    res.json(clients);
  } catch (err) {
    res.status(500).json({ error: 'שגיאה בשליפת לקוחות לתזכורת חיוב' });
  }
};

exports.updateClient = async (req, res) => {
  const { id } = req.params;
  const { full_name, base_discount_percent = 0, cash_discount_percent = 0, phone, email, billing_day } = req.body;
  
  console.log('📋 Updating client ID:', id, 'with data:', {
    full_name,
    base_discount_percent,
    cash_discount_percent,
    phone,
    email,
    billing_day
  });
  
  try {
    const [result] = await pool.query(
      `UPDATE clients SET full_name=?, base_discount_percent=?, cash_discount_percent=?, phone=?, email=?, billing_day=? WHERE id=?`,
      [full_name, base_discount_percent, cash_discount_percent, phone, email, billing_day, id]
    );
    if (result.affectedRows === 0) {
      console.log('❌ Client not found for update:', id);
      return res.status(404).json({ error: 'Client not found' });
    }
    console.log('✅ Client updated successfully:', id);
    res.json({ id, full_name, base_discount_percent, cash_discount_percent, phone, email, billing_day });
  } catch (error) {
    console.error('❌ Error updating client:', error);
    res.status(500).json({ error: 'Server error while updating client' });
  }
};
