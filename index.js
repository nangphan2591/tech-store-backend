// index.js
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

// TỰ ĐỘNG TẠO BẢNG + DỮ LIỆU KHI KHỞI ĐỘNG
const initializeDB = async () => {
  try {
    console.log('Đang khởi tạo database...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        image TEXT NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        description TEXT
      );
    `);

    const count = await pool.query('SELECT COUNT(*) FROM products');
    if (parseInt(count.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO products (name, image, price, description) VALUES
        ('iPhone 15 Pro', 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-7inch-bluetitanium?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1692844253875', 1099.99, 'Chip A17 Pro, titan siêu nhẹ'),
        ('MacBook Air M3', 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mba15-silver-select-202402?wid=904&hei=840&fmt=jpeg&qlt=90&.v=1707417709140', 1299.99, 'Màn hình Liquid Retina, pin 18h'),
        ('Galaxy S24 Ultra', 'https://images.samsung.com/is/image/samsung/p6pim/in/2401/gallery/in-galaxy-s24-s928-sm-s928bzkcins-539573639?$650_519_PNG$', 1199.99, 'Camera 200MP, S Pen'),
        ('Sony WH-1000XM5', 'https://www.sony.com/image/5d3e3c5d7f7a7f1b1a1b1a1b1a1b1a1b?fmt=png-alpha&wid=660', 399.99, 'Chống ồn đỉnh cao'),
        ('Dell XPS 14', 'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/xps-14-9440/media-gallery/xps-14-9440-gray-gallery-1.psd?fmt=png-alpha&wid=600', 1699.99, 'Màn hình OLED 3.2K');
      `);
      console.log('Đã thêm 5 sản phẩm mẫu!');
    } else {
      console.log('Database đã có dữ liệu.');
    }
  } catch (err) {
    console.error('Lỗi khởi tạo DB:', err.message);
  }
};

// GỌI NGAY KHI KHỞI ĐỘNG
initializeDB();

// API: Lấy tất cả sản phẩm
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// API: Lấy sản phẩm theo ID
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

// Trang chủ
app.get('/', (req, res) => {
  res.send('<h1>Tech Store API đang chạy!</h1><p>Truy cập: <a href="/api/products">/api/products</a></p>');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server chạy tại: http://localhost:${PORT}`);
});