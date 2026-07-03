const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db/db');

const router = express.Router();

function toCustomerDTO(row) {
  return {
    id: row.id,
    name: `${row.first_name} ${row.last_name}`,
    email: row.email,
    phone: row.phone,
    address: row.address,
    city: row.city,
    country: row.country
  };
}

// GET /api/auth/session
router.get('/session', async (req, res) => {
  if (!req.session.customerId) return res.json({ loggedIn: false });
  const [[row]] = await pool.query('SELECT * FROM customers WHERE id = ?', [req.session.customerId]);
  if (!row) return res.json({ loggedIn: false });
  res.json({ loggedIn: true, customer: toCustomerDTO(row) });
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { first_name, last_name, email, phone, password, address, city, country } = req.body;

  if (!first_name || !last_name || !email || !phone || !password || !address || !city || !country) {
    return res.status(400).json({ success: false, message: 'Please fill in all required fields.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
  }

  try {
    const [[existing]] = await pool.query('SELECT id FROM customers WHERE email = ?', [email]);
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO customers (first_name, last_name, email, phone, password_hash, address, city, country)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [first_name, last_name, email, phone, passwordHash, address, city, country]
    );

    const [[row]] = await pool.query('SELECT * FROM customers WHERE id = ?', [result.insertId]);
    req.session.customerId = row.id;

    req.session.save(err => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ success: false, message: 'Could not save session.' });
      }
      res.json({ success: true, message: 'Account created successfully!', customer: toCustomerDTO(row) });
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please enter email and password.' });
  }

  try {
    const [[row]] = await pool.query('SELECT * FROM customers WHERE email = ?', [email]);
    if (!row) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const match = await bcrypt.compare(password, row.password_hash);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    req.session.customerId = row.id;
    req.session.save(err => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ success: false, message: 'Could not save session.' });
      }
      res.json({ success: true, message: 'Signed in successfully!', customer: toCustomerDTO(row) });
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

module.exports = router;
