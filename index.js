// index.js - CẬP NHẬT LINK ẢNH + GIÁ VND (TỰ ĐỘNG)
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

// TỰ ĐỘNG TẠO BẢNG + CẬP NHẬT DỮ LIỆU (ẢNH MỚI + GIÁ VND)
const initializeDB = async () => {
  try {
    console.log('Đang khởi tạo và cập nhật database...');

    // Tạo bảng nếu chưa có (price DECIMAL(12,0) cho VND)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        image TEXT NOT NULL,
        price DECIMAL(12,0) NOT NULL,
        description TEXT
      );
    `);

    // Danh sách sản phẩm MỚI (ảnh cập nhật, giá VND)
    const updatedProducts = [
      {
        id: 1,
        name: 'iPhone 16 Pro Max',  // Tên mới
        image: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-pro-finish-select-202409-6-7inch-deserttitanium?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1726434272365',  // Ảnh mới 2025
        price: 35000000,  // 35.000.000 ₫
        description: 'Chip A18 Pro, camera 48MP, pin 5000mAh'
      },
      {
        id: 2,
        name: 'MacBook Air M3 16GB',
        image: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mba15-midnight-select-202402?wid=904&hei=840&fmt=jpeg&qlt=90&.v=1707417709140',  // Ảnh mới (midnight)
        price: 38000000,  // 38.000.000 ₫
        description: 'RAM 16GB, pin 18h, màn hình Liquid Retina'
      },
      {
        id: 3,
        name: 'Samsung Galaxy S25 Ultra',  // Tên mới 2025
        image: 'https://images.samsung.com/is/image/samsung/p6pim/vn/2501/gallery/vn-galaxy-s25-ultra-sm-s938bzkhvna-539573639?$650_519_PNG$',  // Ảnh mới (giả định cho S25)
        price: 32000000,  // 32.000.000 ₫
        description: 'Camera 200MP, S Pen, màn hình 6.9"'
      },
      {
        id: 4,
        name: 'Sony WH-1000XM6',  // Tên mới
        image: 'https://electronics.sony.com/image/5d3e3c5d7f7a7f1b1a1b1a1b1a1b1a1b?fmt=png-alpha&wid=660',  // Ảnh mới XM6
        price: 11000000,  // 11.000.000 ₫
        description: 'Chống ồn AI, pin 40h, kết nối đa thiết bị'
      },
      {
        id: 5,
        name: 'Dell XPS 14 2025',
        image: 'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/xps-14-9440/media-gallery/xps-14-9440-platinum-gallery-1.psd?fmt=png-alpha&wid=600',  // Ảnh mới (platinum)
        price: 48000000,  // 48.000.000 ₫
        description: 'OLED 3.2K, Intel Core Ultra 7, pin 15h'
      }
    ];

    // CẬP NHẬT HOẶC THÊM SẢN PHẨM (UPSERT THEO ID)
    for (const p of updatedProducts) {
      await pool.query(`
        INSERT INTO products (id, name, image, price, description)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          image = EXCLUDED.image,
          price = EXCLUDED.price,
          description = EXCLUDED.description
      `, [p.id, p.name, p.image, p.price, p.description]);
    }

    console.log('Đã cập nhật 5 sản phẩm: ảnh mới + giá VND!');
  } catch (err) {
    console.error('Lỗi cập nhật DB:', err.message);
  }
};

// GỌI NGAY KHI KHỞI ĐỘNG
initializeDB();

// API ROUTES (GIỮ NGUYÊN)
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
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

app.get('/', (req, res) => {
  res.send('<h1>Tech Store API (VND + Ảnh Mới) đang chạy!</h1><p>Truy cập: <a href="/api/products">/api/products</a></p>');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server chạy tại: http://localhost:${PORT}`);
});