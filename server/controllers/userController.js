const pool = require('../config/db');
const xss = require('xss');

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC');
    res.json(users);
  } catch (err) {
    console.error('Get users error:', err.message);
    res.status(500).send('Error fetching users');
  }
};

// Update user role
exports.updateUserRole = async (req, res) => {
  const id = parseInt(req.params.id);
  const role = xss(req.body.role);

  try {
    await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    res.sendStatus(204);
  } catch (err) {
    console.error('Update user role error:', err.message);
    res.status(500).send('Error updating user role');
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    res.sendStatus(204);
  } catch (err) {
    console.error('Delete user error:', err.message);
    res.status(500).send('Error deleting user');
  }
};
