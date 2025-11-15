// tech-store-backend/index.js
const express = require('express');
const cors = require('cors');
const { pool } = require('./db'); // DÙNG FILE DB RIÊNG
require('dotenv').config();

const app = express();

// === MIDDLEWARE ===
app.use(cors());
app.use(express.json());

// === KẾT NỐI AUTH ROUTES ===
const authRoutes = require('./auth');
app.use('/api/auth', authRoutes);

// === KHỞI TẠO DATABASE (AN TOÀN) ===
const initializeDB = async () => {
  try {
    console.log('Đang khởi tạo database (an toàn, không xóa)...');

    // 1. TẠO BẢNG PRODUCTS
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        image TEXT NOT NULL,
        price DECIMAL(12,0) NOT NULL,
        description TEXT,
        category VARCHAR(50)
      );
    `);

    // Thêm cột category nếu chưa có
    try {
      await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS category VARCHAR(50);`);
    } catch (err) {}

    // 2. TẠO BẢNG USERS
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Bảng users đã sẵn sàng.');

    // 3. DỮ LIỆU SẢN PHẨM MẪU (UPSERT)
    const targetProducts = [
      { id: 6, name: 'iPhone 17 Pro Max', image: 'https://cdn1.viettelstore.vn/Images/Product/ProductImage/444965480.jpeg', price: 35000000, description: 'Chip A19 Pro', category: 'Smartphone' },
      { id: 7, name: 'MacBook Air M3 16GB', image: 'https://cdnv2.tgdd.vn/mwg-static/tgdd/Products/Images/44/335362/macbook-air-13-inch-m4-16gb-256gb-tgdd-1-638768909105991664-750x500.jpg', price: 38000000, description: 'RAM 16GB', category: 'Laptop' },
      { id: 8, name: 'Samsung Galaxy S25 Ultra', image: 'https://cdnv2.tgdd.vn/mwg-static/tgdd/Products/Images/42/333352/galaxy-s25-ultra-xanh-duong-1-638748063061861712-750x500.jpg', price: 32000000, description: 'Camera 200MP', category: 'Smartphone' },
      { id: 9, name: 'Sony WH-1000XM6', image: 'https://sony.scene7.com/is/image/sonyglobalsolutions/WH1000XM6_Primary_image_Black?$S7Product$&fmt=png-alpha', price: 11000000, description: 'Chống ồn AI', category: 'Headphones' },
      { id: 10, name: 'Dell XPS 14 2025', image: 'https://newtechshop.vn/wp-content/uploads/2025/10/notebook-xps-14-9440t-gy-gallery-9.webp', price: 48000000, description: 'OLED 3.2K', category: 'Laptop' }
    ];

    for (const p of targetProducts) {
      await pool.query(`
        INSERT INTO products (id, name, image, price, description, category)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          image = EXCLUDED.image,
          price = EXCLUDED.price,
          description = EXCLUDED.description,
          category = EXCLUDED.category
      `, [p.id, p.name, p.image, p.price, p.description, p.category]);
    }

    console.log('Đã cập nhật 5 sản phẩm + bảng users!');
  } catch (err) {
    console.error('Lỗi khởi tạo DB:', err.message);
  }
};

// GỌI KHỞI TẠO
initializeDB().catch(console.error);

// === API ROUTES ===
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error('Lỗi GET products:', err.message);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Không tìm thấy' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Lỗi GET product:', err.message);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

app.get('/api/products/category/:category', async (req, res) => {
  const { category } = req.params;
  try {
    const result = await pool.query('SELECT * FROM products WHERE category = $1', [category]);
    res.json(result.rows);
  } catch (err) {
    console.error('Lỗi GET category:', err.message);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

app.get('/', (req, res) => {
  res.send('<h1>Tech Store API OK!</h1><p>POST /api/auth/register</p>');
});

// === SERVER START ===
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server chạy tại: https://tech-store-backend-a48m.onrender.com`);
});