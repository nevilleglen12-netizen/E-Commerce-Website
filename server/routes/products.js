const express = require('express');
const pool = require('../db/db');

const router = express.Router();

const SORT_MAP = {
  featured:   'p.is_featured DESC, p.created_at DESC',
  price_asc:  'p.price ASC',
  price_desc: 'p.price DESC',
  rating:     'p.rating DESC',
  newest:     'p.created_at DESC'
};

// GET /api/categories
router.get('/categories', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT name, slug, icon FROM categories ORDER BY name ASC');
    res.json({ success: true, categories: rows });
  } catch (err) {
    console.error('Categories error:', err);
    res.status(500).json({ success: false, message: 'Could not load categories.' });
  }
});

// GET /api/products?featured=1&category=slug&search=term&min_price=&max_price=&sort=
router.get('/products', async (req, res) => {
  try {
    const { featured, category, search, min_price, max_price, sort } = req.query;

    const where = [];
    const params = [];

if (featured === '1') {
  where.push('p.is_featured = true');
}
    if (category) {
      where.push('c.slug = ?');
      params.push(category);
    }
    if (search) {
      where.push('(p.name LIKE ? OR p.brand LIKE ? OR p.description LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term);
    }
    if (min_price !== undefined) {
      where.push('p.price >= ?');
      params.push(Number(min_price) || 0);
    }
    if (max_price !== undefined) {
      where.push('p.price <= ?');
      params.push(Number(max_price) || 9999999);
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const orderClause = SORT_MAP[sort] || SORT_MAP.featured;

    const [rows] = await pool.query(
      `SELECT p.id, p.name, p.description, p.brand, p.price, p.original_price, p.stock_qty,
              p.image_url, p.rating, p.reviews_count, p.is_featured,
              c.name AS category_name, c.slug AS category_slug
       FROM products p
       JOIN categories c ON c.id = p.category_id
       ${whereClause}
       ORDER BY ${orderClause}`,
      params
    );

    res.json({ success: true, count: rows.length, products: rows });
  } catch (err) {
    console.error('Products error:', err);
    res.status(500).json({ success: false, message: 'Could not load products.' });
  }
});

// GET /api/products/:id
router.get('/products/:id', async (req, res) => {
  try {
    const [[row]] = await pool.query(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM products p
       JOIN categories c ON c.id = p.category_id
       WHERE p.id = ?`,
      [req.params.id]
    );
    if (!row) return res.status(404).json({ success: false, message: 'Product not found.' });
    res.json({ success: true, product: row });
  } catch (err) {
    console.error('Product detail error:', err);
    res.status(500).json({ success: false, message: 'Could not load product.' });
  }
});

module.exports = router;
