// tech-store-backend/db.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Kiểm tra kết nối (tùy chọn)
pool.on('connect', () => {
  console.log('Đã kết nối PostgreSQL');
});

pool.on('error', (err) => {
  console.error('Lỗi PostgreSQL:', err.message);
});

module.exports = { pool };