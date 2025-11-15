// tech-store-backend/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt'); // Dùng bcrypt như file của bạn đã require
const jwt = require('jsonwebtoken');
const { pool } = require('./db'); // DÙNG FILE DB
require('dotenv').config(); // Tải biến môi trường

// Lấy secret key, nếu không có trong .env thì dùng key dự phòng
const JWT_SECRET = process.env.JWT_SECRET || 'techstore_secret_vn_2025';

// === ĐĂNG KÝ ===
// (POST /api/auth/register)
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  // 1. Kiểm tra đầu vào
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Vui lòng điền đầy đủ' });
  }

  try {
    // 2. Kiểm tra email đã tồn tại chưa
    const check = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (check.rows.length > 0) {
      // Đây là nơi file của bạn bị cắt
      return res.status(400).json({ error: 'Email đã tồn tại' });
    }

    // 3. Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Thêm user mới vào CSDL
    // (Bảng 'users' của bạn cần name, email, password)
    const newUser = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, created_at',
      [name, email, hashedPassword] // Phải là 3 giá trị
    );

    // 5. Trả về thông báo thành công
    res.status(201).json({
      message: 'Đăng ký thành công',
      user: newUser.rows[0],
    });

  } catch (err) {
    console.error('Lỗi /register:', err.message);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// === ĐĂNG NHẬP ===
// (POST /api/auth/login)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // 1. Kiểm tra đầu vào
  if (!email || !password) {
    return res.status(400).json({ error: 'Vui lòng điền đầy đủ' });
  }

  try {
    // 2. Tìm user bằng email
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      // Bảo mật: Không nên nói rõ là "sai email" hay "sai password"
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
    }

    const user = userResult.rows[0];

    // 3. So sánh mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
    }

    // 4. Tạo JSON Web Token (JWT)
    const payload = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };

    const token = jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: '1h' } // Token hết hạn sau 1 giờ
    );

    // 5. Trả về token và thông tin user (trừ password)
    res.status(200).json({
      message: 'Đăng nhập thành công',
      token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (err) {
    console.error('Lỗi /login:', err.message);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

module.exports = router;