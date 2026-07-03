const express = require('express');
const pool = require('../db/db');

const router = express.Router();

function requireAuth(req, res, next) {
  if (!req.session.customerId) {
    return res.status(401).json({ success: false, message: 'Please sign in first.' });
  }
  next();
}

function generateOrderNumber() {
  const rand = Math.random().toString(36).substr(2, 8).toUpperCase();
  return `ORD-${rand}`;
}

// POST /api/orders – place an order transactionally, reducing stock
router.post('/', requireAuth, async (req, res) => {
  const { items, shipping_address, shipping_city, payment_method, notes } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Your cart is empty.' });
  }
  if (!shipping_address || !shipping_city) {
    return res.status(400).json({ success: false, message: 'Please provide a delivery address and city.' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const [[product]] = await conn.query(
        'SELECT id, name, price, stock_qty FROM products WHERE id = ? FOR UPDATE',
        [item.product_id]
      );
      if (!product) {
        throw new Error(`Product ${item.product_id} no longer exists.`);
      }
      if (item.quantity < 1 || item.quantity > product.stock_qty) {
        throw new Error(`Not enough stock for "${product.name}".`);
      }

      await conn.query('UPDATE products SET stock_qty = stock_qty - ? WHERE id = ?', [item.quantity, product.id]);

      subtotal += Number(product.price) * item.quantity;
      orderItems.push({
        product_id: product.id,
        product_name: product.name,
        unit_price: product.price,
        quantity: item.quantity
      });
    }

    const shippingFee = 200;
    const total = subtotal + shippingFee;
    const orderNumber = generateOrderNumber();

    const [orderResult] = await conn.query(
      `INSERT INTO orders
        (order_number, customer_id, status, payment_method, shipping_address, shipping_city, notes, subtotal, shipping_fee, total)
       VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?)`,
      [orderNumber, req.session.customerId, payment_method || 'cash_on_delivery', shipping_address, shipping_city, notes || null, subtotal, shippingFee, total]
    );

    for (const oi of orderItems) {
      await conn.query(
        `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity)
         VALUES (?, ?, ?, ?, ?)`,
        [orderResult.insertId, oi.product_id, oi.product_name, oi.unit_price, oi.quantity]
      );
    }

    await conn.commit();
    res.json({ success: true, order_number: orderNumber, total });
  } catch (err) {
    await conn.rollback();
    console.error('Place order error:', err);
    res.status(400).json({ success: false, message: err.message || 'Could not place order.' });
  } finally {
    conn.release();
  }
});

// GET /api/orders – current customer's order history
router.get('/', requireAuth, async (req, res) => {
  try {
    const [orders] = await pool.query(
      `SELECT o.id, o.order_number, o.status, o.payment_method, o.shipping_address,
              o.shipping_city, o.total, o.created_at,
              (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS item_count
       FROM orders o
       WHERE o.customer_id = ?
       ORDER BY o.created_at DESC`,
      [req.session.customerId]
    );
    res.json({ success: true, orders });
  } catch (err) {
    console.error('My orders error:', err);
    res.status(500).json({ success: false, message: 'Could not load orders.' });
  }
});

module.exports = router;
