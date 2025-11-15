// tech-store-backend/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('./db'); // DÙNG FILE DB

const JWT_SECRET = process.env.JWT_SECRET || 'techstore_secret_vn_2025';

// === ĐĂNG KÝ ===
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Vui lòng điền đầy đủ' });
  }

  try {
    const check = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (check.rows.length