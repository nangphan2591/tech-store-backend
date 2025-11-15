const express = require('express');
const bcrypt = require('bcryptjs'); // Mã hóa mật khẩu
const jwt = require('jsonwebtoken'); // Tạo token
const { pool } = require('./db'); // Lấy pool kết nối
const router = express.Router();

// === 1. API ĐĂNG KÝ ===
// POST /api/auth/register
router.post('/register', async (req, res) => {
  // Lấy dữ liệu từ Flutter app (username, email, password)
  // (Lưu ý: auth_provider.dart gửi 'username')
  const { username, email, password } = req.body;

  // Validate dữ liệu
  if (!username || !email || !password || password.length < 6) {
    return res.status(400).json({ message: 'Dữ liệu không hợp lệ. Mật khẩu cần ít nhất 6 ký tự.' });
  }

  try {
    // 1. Kiểm tra xem email đã tồn tại chưa
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'Email đã được đăng ký.' });
    }

    // 2. Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Lưu user mới vào database
    // (Bảng 'users' của bạn có cột 'name', chúng ta sẽ dùng 'username' cho cột 'name')
    const newUser = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, email, name',
      [username, email, hashedPassword]
    );

    // 4. Trả về thành công
    res.status(201).json({ // 201 = Created
      message: 'Đăng ký tài khoản thành công!',
      user: newUser.rows[0]
    });

  } catch (err) {
    console.error('LỖI /api/auth/register:', err.message);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  }
});


// === 2. API ĐĂNG NHẬP ===
// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Vui lòng nhập email và mật khẩu.' });
  }

  try {
    // 1. Tìm user bằng email
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      // Không tìm thấy email
      return res.status(400).json({ message: 'Email hoặc mật khẩu không chính xác.' });
    }
    
    const user = result.rows[0];

    // 2. So sánh mật khẩu đã mã hóa
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Sai mật khẩu
      return res.status(400).json({ message: 'Email hoặc mật khẩu không chính xác.' });
    }

    // 3. Tạo JSON Web Token (JWT)
    const payload = {
      id: user.id,
      email: user.email
    };
    
    // Lấy secret key từ file .env
    const secret = process.env.JWT_SECRET || 'mot_bi_mat_rat_an_toan_123';
    
    const token = jwt.sign(payload, secret, { expiresIn: '1d' }); // Token hết hạn sau 1 ngày

    // 4. Trả về token và thông tin user
    res.status(200).json({
      message: 'Đăng nhập thành công!',
      token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (err) {
    console.error('LỖI /api/auth/login:', err.message);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  }
});

// Xuất router để index.js có thể dùng
module.exports = router;