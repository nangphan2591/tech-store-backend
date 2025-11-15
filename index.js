// index.js - KHÔNG XÓA DỮ LIỆU, CHỈ CẬP NHẬT (UPSERT) + THÊM CATEGORY
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(cors());
app.use(express.json());

// TỰ ĐỘNG CẬP NHẬT: KHÔNG XÓA, CHỈ UPSERT + THÊM CỘT category
const initializeDB = async () => {
  try {
    console.log('Đang kiểm tra và cập nhật database (an toàn, không xóa)...');

    // TẠO BẢNG + THÊM CỘT category NẾU CHƯA CÓ
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

    // Thêm cột category nếu chưa tồn tại
    try {
      await pool.query(`
        ALTER TABLE products ADD COLUMN IF NOT EXISTS category VARCHAR(50);
      `);
      console.log('Đã thêm cột category (nếu chưa có).');
    } catch (err) {
      console.log('Cột category đã tồn tại.');
    }

    // DỮ LIỆU MỚI MUỐN CẬP NHẬT (bạn có thể sửa thoải mái)
    const targetProducts = [
      {
        id: 6,
        name: 'iPhone 17 Pro Max',
        image: 'https://cdn1.viettelstore.vn/Images/Product/ProductImage/444965480.jpeg',
        price: 35000000,
        description: 'Chip A19 Pro, Camera 18MP Center Stage, Khẩu độ ƒ(1.9), pin 5000mAh',
        category: 'Smartphone'
      },
      {
        id: 7,
        name: 'MacBook Air M3 16GB',
        image: 'https://cdnv2.tgdd.vn/mwg-static/tgdd/Products/Images/44/335362/macbook-air-13-inch-m4-16gb-256gb-tgdd-1-638768909105991664-750x500.jpg',
        price: 38000000,
        description: 'RAM 16GB, pin 18h, màn hình Liquid Retina',
        category: 'Laptop'
      },
      {
        id: 8,
        name: 'Samsung Galaxy S25 Ultra',
        image: 'https://cdnv2.tgdd.vn/mwg-static/tgdd/Products/Images/42/333352/galaxy-s25-ultra-xanh-duong-1-638748063061861712-750x500.jpg',
        price: 32000000,
        description: 'Camera 200MP, S Pen, màn hình 6.9"',
        category: 'Smartphone'
      },
      {
        id: 9,
        name: 'Sony WH-1000XM6',
        image: 'https://sony.scene7.com/is/image/sonyglobalsolutions/WH1000XM6_Primary_image_Black?$S7Product$&fmt=png-alpha',
        price: 11000000,
        description: 'Chống ồn AI, pin 40h, kết nối đa thiết bị',
        category: 'Headphones'
      },
      {
        id: 10,
        name: 'Dell XPS 14 2025',
        image: 'https://newtechshop.vn/wp-content/uploads/2025/10/notebook-xps-14-9440t-gy-gallery-9.webp',
        price: 48000000,
        description: 'OLED 3.2K, Intel Core Ultra 7, pin 15h',
        category: 'Laptop'
      }
    ];

    // UPSERT: CẬP NHẬT HOẶC THÊM MỚI THEO ID
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

    console.log('Đã cập nhật 5 sản phẩm (an toàn, không xóa)!');
  } catch (err) {
    console.error('Lỗi cập nhật DB:', err.message);
  }
};

// GỌI NGAY KHI KHỞI ĐỘNG
initializeDB();

// === API ROUTES ===
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY id');
    res.json(result.rows);
  } catch (err) {
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
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// LỌC THEO DANH MỤC
app.get('/api/products/category/:category', async (req, res) => {
  const { category } = req.params;
  try {
    const result = await pool.query('SELECT * FROM products WHERE category = $1', [category]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

app.get('/', (req, res) => {
  res.send(`
    <h1>Tech Store API (AN TOÀN - KHÔNG XÓA DỮ LIỆU)</h1>
    <p><a href="/api/products">Tất cả sản phẩm</a></p>
    <p>Lọc: 
      <a href="/api/products/category/Smartphone">Smartphone</a> | 
      <a href="/api/products/category/Laptop">Laptop</a> | 
      <a href="/api/products/category/Headphones">Headphones</a>
    </p>
  `);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server chạy tại: http://localhost:${PORT}`);
});