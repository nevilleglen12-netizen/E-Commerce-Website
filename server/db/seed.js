// Seeds the shopease database with categories and a starter product catalog.
// Run with: npm run seed   (after schema.sql has been applied)
require('dotenv').config();
const pool = require('./db');

const categories = [
  { name: 'Electronics',        slug: 'electronics',   icon: '📱' },
  { name: 'Fashion',            slug: 'fashion',        icon: '👗' },
  { name: 'Home & Kitchen',     slug: 'home-kitchen',   icon: '🏠' },
  { name: 'Sports & Fitness',   slug: 'sports',         icon: '⚽' },
  { name: 'Beauty & Health',    slug: 'beauty',         icon: '💄' },
  { name: 'Books & Stationery', slug: 'books',          icon: '📚' }
];

const products = [
  { slug: 'electronics', name: 'Samsung Galaxy A54 Smartphone', description: 'Triple camera 50MP, 6.4" Super AMOLED display, 5000mAh battery, 128GB storage.', brand: 'Samsung', price: 34999, original_price: 42000, stock_qty: 45, image_url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&h=400&fit=crop', rating: 4.5, reviews_count: 312, is_featured: 1 },
  { slug: 'electronics', name: 'HP Pavilion Laptop 15"', description: 'Intel Core i5, 8GB RAM, 512GB SSD, Windows 11. Perfect for students and professionals.', brand: 'HP', price: 78000, original_price: 89000, stock_qty: 18, image_url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop', rating: 4.3, reviews_count: 198, is_featured: 1 },
  { slug: 'electronics', name: 'Sony WH-1000XM5 Headphones', description: 'Industry-leading noise cancellation, 30-hour battery life, crystal-clear call quality.', brand: 'Sony', price: 28500, original_price: 35000, stock_qty: 30, image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop', rating: 4.7, reviews_count: 445, is_featured: 1 },
  { slug: 'electronics', name: 'Apple iPad 10th Gen', description: '10.9" Liquid Retina display, A14 Bionic chip, 64GB, Wi-Fi. Thin and powerful.', brand: 'Apple', price: 65000, original_price: 72000, stock_qty: 22, image_url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=400&fit=crop', rating: 4.6, reviews_count: 287, is_featured: 0 },
  { slug: 'electronics', name: 'Canon EOS M50 Camera', description: '24.1MP APS-C sensor, 4K video, built-in Wi-Fi, compact mirrorless design.', brand: 'Canon', price: 95000, original_price: 110000, stock_qty: 10, image_url: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&h=400&fit=crop', rating: 4.4, reviews_count: 153, is_featured: 0 },
  { slug: 'fashion', name: 'Men Classic Oxford Shoes', description: 'Premium leather oxford shoes with cushioned insole. Ideal for office occasions.', brand: 'Clarks', price: 4500, original_price: 6200, stock_qty: 80, image_url: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=400&h=400&fit=crop', rating: 4.2, reviews_count: 211, is_featured: 0 },
  { slug: 'fashion', name: 'Women Floral Maxi Dress', description: 'Lightweight chiffon fabric with elegant floral print. Adjustable straps, machine washable.', brand: 'Zara', price: 2800, original_price: 3900, stock_qty: 120, image_url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&h=400&fit=crop', rating: 4.1, reviews_count: 176, is_featured: 1 },
  { slug: 'fashion', name: 'Leather Handbag – Tan', description: 'Genuine leather top-handle bag with adjustable strap. Multiple compartments.', brand: 'Coach', price: 5200, original_price: 7800, stock_qty: 55, image_url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop', rating: 4.5, reviews_count: 309, is_featured: 1 },
  { slug: 'fashion', name: 'Men Slim Fit Suit', description: 'Two-piece suit in premium wool blend. Slim-cut jacket and trousers.', brand: 'Hugo Boss', price: 12500, original_price: 16000, stock_qty: 35, image_url: 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=400&h=400&fit=crop', rating: 4.6, reviews_count: 94, is_featured: 0 },
  { slug: 'fashion', name: 'Running Sneakers – White', description: 'Breathable mesh upper, rubber outsole, memory foam insole. Lightweight design.', brand: 'Nike', price: 3800, original_price: 5000, stock_qty: 150, image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop', rating: 4.4, reviews_count: 528, is_featured: 1 },
  { slug: 'home-kitchen', name: 'Stainless Steel Cookware Set 8pc', description: 'Induction-compatible pots and pans with glass lids. Dishwasher safe, non-stick coating.', brand: 'Tefal', price: 8900, original_price: 12000, stock_qty: 40, image_url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop', rating: 4.3, reviews_count: 267, is_featured: 1 },
  { slug: 'home-kitchen', name: 'Coffee Maker – Drip 12 Cup', description: 'Programmable timer, auto shut-off, reusable filter, keep-warm plate.', brand: 'Philips', price: 5400, original_price: 7200, stock_qty: 60, image_url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop', rating: 4.5, reviews_count: 341, is_featured: 0 },
  { slug: 'sports', name: 'Yoga Mat – Non-Slip 6mm', description: 'Eco-friendly TPE material, extra thick 6mm cushion, non-slip surface.', brand: 'Liforme', price: 2200, original_price: 3000, stock_qty: 180, image_url: 'https://images.unsplash.com/photo-1601925228408-92aef58419e3?w=400&h=400&fit=crop', rating: 4.4, reviews_count: 634, is_featured: 1 },
  { slug: 'sports', name: 'Adjustable Dumbbell Set 20kg', description: 'Cast iron with rubber coating, ergonomic grip, adjustable weight.', brand: 'Bowflex', price: 6800, original_price: 9500, stock_qty: 25, image_url: 'https://images.unsplash.com/photo-1585858229735-cd08d8cb510d?w=400&h=400&fit=crop', rating: 4.6, reviews_count: 218, is_featured: 1 },
  { slug: 'beauty', name: 'Vitamin C Serum 30ml', description: 'Brightening serum with 20% Vitamin C, hyaluronic acid and vitamin E.', brand: 'The Ordinary', price: 1500, original_price: 2200, stock_qty: 250, image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=400&fit=crop', rating: 4.5, reviews_count: 712, is_featured: 1 },
  { slug: 'beauty', name: 'Perfume – Oud & Rose 100ml', description: 'Luxury oriental fragrance with base notes of oud, amber and musk. 12-hour lasting.', brand: 'Armani', price: 4800, original_price: 6500, stock_qty: 70, image_url: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400&h=400&fit=crop', rating: 4.7, reviews_count: 184, is_featured: 1 },
  { slug: 'books', name: 'The Psychology of Money', description: 'Timeless lessons on wealth, greed and happiness. Must-read for personal finance.', brand: 'Harriman House', price: 850, original_price: 1200, stock_qty: 500, image_url: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400&h=400&fit=crop', rating: 4.8, reviews_count: 1204, is_featured: 1 },
  { slug: 'books', name: 'Atomic Habits – James Clear', description: 'An easy and proven way to build good habits and break bad ones.', brand: 'Penguin', price: 950, original_price: 1400, stock_qty: 480, image_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=400&fit=crop', rating: 4.9, reviews_count: 2341, is_featured: 1 }
];

async function seed() {
  const conn = await pool.getConnection();
  try {
    console.log('Seeding categories…');
    const slugToId = {};
for (const c of categories) {
 const [result] = await conn.query(
         `INSERT INTO categories (name, slug, icon)
          VALUES (?, ?, ?)
          ON CONFLICT (slug) DO UPDATE
          SET name = EXCLUDED.name, icon = EXCLUDED.icon
          RETURNING id`,
         [c.name, c.slug, c.icon]
       );
 slugToId[c.slug] = result.rows[0].id;
     }
    console.log('Seeding products…');
    for (const p of products) {
      const categoryId = slugToId[p.slug];
      await conn.query(
        `INSERT INTO products
          (category_id, name, description, brand, price, original_price, stock_qty, image_url, rating, reviews_count, is_featured)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [categoryId, p.name, p.description, p.brand, p.price, p.original_price, p.stock_qty, p.image_url, p.rating, p.reviews_count, p.is_featured]
      );
    }

    console.log('Seed complete ✔');
  } finally {
    conn.release();
    await pool.end();
  }
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
