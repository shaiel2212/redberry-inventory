const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const xss = require('xss');
const pool = require('../config/db');

// Register User
exports.registerUser = async (req, res) => {
  const username = xss(req.body.username);
  const email = xss(req.body.email);
  const password = req.body.password;
  const role = xss(req.body.role || 'user');


  if (!username || !email || !password) {
    
    return res.status(400).json({ message: 'Please enter all required fields' });
  }

  if (!process.env.JWT_SECRET) {
    console.error('Missing JWT_SECRET!');
    return res.status(500).json({ message: 'Server misconfiguration: JWT_SECRET is not defined' });
  }

  try {
    console.log('Checking existing users...');

    const [existingUsers] = await pool.query(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    console.log('Existing users checked.');

    if (existingUsers.length > 0) {
      console.log('User already exists');
      return res.status(400).json({ message: 'User already exists with this username or email' });
    }
    console.log('Hashing password...');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log('Password hashed');


    console.log('Inserting user...');

    const newUser = {
      username,
      email,
      password_hash: hashedPassword,
      role
    };

    const [result] = await pool.query('INSERT INTO users SET ?', newUser);
    const userId = result.insertId;

    const payload = {
      id: userId,
      username: newUser.username,
      role: newUser.role
    };
    console.log('User inserted');


    console.log('Creating token...');

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' });

    res.status(201).json({
      token,
      user: {
        id: userId,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).send('Server error during registration');
  }
  console.log('Token created');

};

// Login User
exports.loginUser = async (req, res) => {
  const username = xss(req.body.username);
  const password = req.body.password;
  console.log('Environment:', process.env.NODE_ENV);
  console.log('API Base URL:', process.env.REACT_APP_API_BASE_URL);
  if (!username || !password) {
    return res.status(400).json({ message: 'Please enter username and password' });
  }

  if (!process.env.JWT_SECRET) {
    console.error('Missing JWT_SECRET!');
    return res.status(500).json({ message: 'Server misconfiguration: JWT_SECRET is not defined' });
  }

  try {
    const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials (user not found)' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials (password mismatch)' });
    }

    const payload = {
      id: user.id,
      username: user.username,
      role: user.role
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).send('Server error during login');
  }
};

// Get Logged In User
exports.getLoggedInUser = async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(users[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
