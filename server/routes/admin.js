const express = require('express');
const pool = require('../db/db');
 
const router = express.Router();
 
const VALID_STATUSES = ['pending','confirmed','processing','shipped','delivered','cancelled'];
 
// ----------------------------------------------------------------
// GET /api/admin/stats – headline numbers for the dashboard
// ----------------------------------------------------------------
router.get('/stats', async (req, res) => {
  try {
    const [[orderStats]] = await pool.query(`
      SELECT
        COUNT(*)                                          AS total_orders,
        COALESCE(SUM(total), 0)                          AS total_revenue,
        COALESCE(SUM(CASE WHEN status = 'pending'    THEN 1 ELSE 0 END), 0) AS pending_orders,
        COALESCE(SUM(CASE WHEN status = 'delivered'  THEN 1 ELSE 0 END), 0) AS delivered_orders
      FROM orders
    `);
 
    const [[productStats]] = await pool.query(`
      SELECT
        COUNT(*)                                                      AS total_products,
        COALESCE(SUM(CASE WHEN stock_qty = 0 THEN 1 ELSE 0 END), 0) AS out_of_stock,
        COALESCE(SUM(CASE WHEN stock_qty > 0 AND stock_qty <= 5 THEN 1 ELSE 0 END), 0) AS low_stock
      FROM products
    `);
 
    res.json({ success: true, stats: { ...orderStats, ...productStats } });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ success: false, message: 'Could not load stats.' });
  }
});
 
// ----------------------------------------------------------------
// GET /api/admin/orders – all orders, newest first, with items
// ----------------------------------------------------------------
router.get('/orders', async (req, res) => {
  try {
    const [orders] = await pool.query(`
      SELECT
        o.id, o.order_number, o.status, o.payment_method,
        o.shipping_address, o.shipping_city,
        o.subtotal, o.shipping_fee, o.total, o.notes,
        o.created_at,
        CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
        c.email AS customer_email,
        c.phone AS customer_phone
      FROM orders o
      JOIN customers c ON c.id = o.customer_id
      ORDER BY o.created_at DESC
    `);
 
    const [items] = await pool.query(`
      SELECT oi.order_id, oi.product_name, oi.unit_price, oi.quantity
      FROM order_items oi
    `);
 
    const itemsByOrder = {};
    for (const item of items) {
      if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
      itemsByOrder[item.order_id].push(item);
    }
 
    const result = orders.map(o => ({ ...o, items: itemsByOrder[o.id] || [] }));
    res.json({ success: true, orders: result });
  } catch (err) {
    console.error('Admin orders error:', err);
    res.status(500).json({ success: false, message: 'Could not load orders.' });
  }
});
 
// ----------------------------------------------------------------
// PATCH /api/admin/orders/:id/status – update order status
// ----------------------------------------------------------------
router.patch('/orders/:id/status', async (req, res) => {
  const { status } = req.body;
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status.' });
  }
  try {
    const [result] = await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Order not found.' });
    res.json({ success: true });
  } catch (err) {
    console.error('Update order status error:', err);
    res.status(500).json({ success: false, message: 'Could not update order status.' });
  }
});
 
// ----------------------------------------------------------------
// GET /api/admin/products – all products with category + stock
// ----------------------------------------------------------------
router.get('/products', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.id, p.name, p.brand, p.price, p.original_price, p.stock_qty,
             p.image_url, p.rating, p.reviews_count, p.is_featured, p.created_at,
             c.id AS category_id, c.name AS category_name, c.slug AS category_slug
      FROM products p
      JOIN categories c ON c.id = p.category_id
      ORDER BY p.stock_qty ASC, p.name ASC
    `);
    res.json({ success: true, products: rows });
  } catch (err) {
    console.error('Admin products error:', err);
    res.status(500).json({ success: false, message: 'Could not load products.' });
  }
});
 
// ----------------------------------------------------------------
// POST /api/admin/products – add a new product
// ----------------------------------------------------------------
router.post('/products', async (req, res) => {
  const { name, brand, description, category_id, price, original_price, stock_qty, image_url, is_featured } = req.body;
  if (!name || !category_id || !price || !stock_qty || !image_url) {
    return res.status(400).json({ success: false, message: 'name, category_id, price, stock_qty and image_url are required.' });
  }
  try {
    const [[cat]] = await pool.query('SELECT id FROM categories WHERE id = ?', [category_id]);
    if (!cat) return res.status(400).json({ success: false, message: 'Category not found.' });
 
    const [result] = await pool.query(
      `INSERT INTO products
         (category_id, name, description, brand, price, original_price, stock_qty, image_url, is_featured)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
[category_id, name, description || null, brand || null, price, original_price || null, stock_qty, image_url, !!is_featured]    );
    const [[row]] = await pool.query(`
      SELECT p.*, c.name AS category_name, c.slug AS category_slug
      FROM products p JOIN categories c ON c.id = p.category_id WHERE p.id = ?`, [result.insertId]);
    res.status(201).json({ success: true, product: row });
  } catch (err) {
    console.error('Add product error:', err);
    res.status(500).json({ success: false, message: 'Could not add product.' });
  }
});
 
// ----------------------------------------------------------------
// PATCH /api/admin/products/:id/stock – restock or zero-out
// ----------------------------------------------------------------
router.patch('/products/:id/stock', async (req, res) => {
  const { stock_qty } = req.body;
  if (stock_qty === undefined || isNaN(Number(stock_qty)) || Number(stock_qty) < 0) {
    return res.status(400).json({ success: false, message: 'stock_qty must be a non-negative number.' });
  }
  try {
    const [result] = await pool.query('UPDATE products SET stock_qty = ? WHERE id = ?', [Number(stock_qty), req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Product not found.' });
    res.json({ success: true });
  } catch (err) {
    console.error('Update stock error:', err);
    res.status(500).json({ success: false, message: 'Could not update stock.' });
  }
});
 
// ----------------------------------------------------------------
// DELETE /api/admin/products/:id – remove a product (only if 0 stock or forced)
// ----------------------------------------------------------------
router.delete('/products/:id', async (req, res) => {
  try {
    const [[product]] = await pool.query('SELECT id, name, stock_qty FROM products WHERE id = ?', [req.params.id]);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
 
    await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: `"${product.name}" removed.` });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ success: false, message: 'Could not delete product. It may be referenced by existing orders.' });
  }
});
 
module.exports = router;