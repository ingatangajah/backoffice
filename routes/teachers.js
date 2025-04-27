const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');

// CREATE
router.post('/', async (req, res) => {
  try {
    const {
      full_name, email, birthdate, nickname, gender,
      phone_number, address, city_id, city_name,
      province_id, province_name, branch_id,
      package_id, last_education_place, daily_language, join_with_ig
    } = req.body;

    let users_id = null;

    if (email) {
      const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

      if (existingUser.rows.length > 0) {
        users_id = existingUser.rows[0].id;
      } else {
        const password = await bcrypt.hash(birthdate.split('-').reverse().join(''), 10);
        const newUser = await pool.query(
          'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id',
          [full_name, email, password]
        );
        users_id = newUser.rows[0].id;
      }
    }

    const result = await pool.query(
      `INSERT INTO teachers (
        full_name, birthdate, nickname, gender, phone_number, address, city_id, city_name,
        province_id, province_name, users_id, branch_id, package_id, last_education_place,
        daily_language, join_with_ig
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16
      ) RETURNING *`,
      [
        full_name, birthdate, nickname, gender, phone_number, address, city_id, city_name,
        province_id, province_name, users_id, branch_id, package_id, last_education_place,
        daily_language, join_with_ig
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating teacher:', err);
    res.status(500).json({ error: err.message });
  }
});

// READ ALL
router.get('/', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        t.*,
        u.email,
        u.role,
        b.name AS branch_name,
        p.name AS package_name
      FROM teachers t
      LEFT JOIN users u ON t.users_id = u.id
      LEFT JOIN branches b ON t.branch_id = b.id
      LEFT JOIN packages p ON t.package_id = p.id
      ORDER BY t.id ASC
    `);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching teachers:', err);
    res.status(500).json({ error: err.message });
  }
});

// READ ONE
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM teachers WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Teacher not found' });
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching teacher:', err);
    res.status(500).json({ error: err.message });
  }
});

// UPDATE
router.put('/:id', async (req, res) => {
  try {
    const fields = [
      'full_name', 'birthdate', 'nickname', 'gender',
      'phone_number', 'address', 'city_id', 'city_name',
      'province_id', 'province_name', 'branch_id', 'package_id',
      'last_education_place', 'daily_language', 'join_with_ig'
    ];

    const updates = fields.map((field, i) => `${field} = $${i + 1}`).join(', ');
    const values = fields.map(f => req.body[f]);

    const result = await pool.query(
      `UPDATE teachers SET ${updates} WHERE id = $${fields.length + 1} RETURNING *`,
      [...values, req.params.id]
    );

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Error updating teacher:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM teachers WHERE id = $1', [req.params.id]);
    res.status(200).json({ message: 'Teacher deleted successfully' });
  } catch (err) {
    console.error('Error deleting teacher:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
