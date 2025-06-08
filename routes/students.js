const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');

// CREATE
router.post('/', async (req, res) => {
    try {
      const {
        full_name, email, birthdate, nickname, gender, current_school,
        phone_number, daily_language, address, city_id, city_name,
        province_id, province_name, branch_id,
        parent_name, parent_birthdate, parent_id_number, parent_occupation,
        parent_address, parent_city, parent_city_id,
        parent_province, parent_province_id, parent_source_of_info, form_filler, status
      } = req.body;
  
      let users_id = null;
  
      if (email) {
        const userCheck = await pool.query(
          'SELECT id FROM users WHERE email = $1',
          [email]
        );
  
        if (userCheck.rows.length > 0) {
          users_id = userCheck.rows[0].id;
        } else {
          const hashedPassword = await bcrypt.hash(
            birthdate.split('-').reverse().join(''),
            10
          );
          const newUser = await pool.query(
            'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id',
            [full_name, email, hashedPassword]
          );
          users_id = newUser.rows[0].id;
        }
      }
  
      const result = await pool.query(
        `INSERT INTO students (
          full_name, birthdate, nickname, gender, current_school, phone_number,
          daily_language, address, city_id, city_name, province_id, province_name,
          branch_id, parent_name, parent_birthdate, parent_id_number, parent_occupation,
          parent_address, parent_city, parent_city_id, parent_province,
          parent_province_id, parent_source_of_info, users_id, form_filler, status
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19,
          $20, $21, $22, $23, $24, $25, $26
        ) RETURNING *`,
        [
          full_name, birthdate, nickname, gender, current_school, phone_number,
          daily_language, address, city_id, city_name, province_id, province_name,
          branch_id, parent_name, parent_birthdate, parent_id_number, parent_occupation,
          parent_address, parent_city, parent_city_id, parent_province,
          parent_province_id, parent_source_of_info, users_id, form_filler, status
        ]
      );
  
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error('Error adding student:', err);
      res.status(500).json({ error: err.message });
    }
  });
  

// READ ALL
router.get('/', async (req, res) => {
    const { page = 1, search = '', limit } = req.query;
    const searchTerm = `%${search.toLowerCase()}%`;
    const pageNumber = parseInt(page, 10);
    const limitNumber = limit ? parseInt(limit, 10) : null;
    const offset = limitNumber ? (pageNumber - 1) * limitNumber : 0;
  
    try {
      let query = `
        SELECT 
          s.*,
          b.name AS branch_name,
          p.name AS latest_package_name,
          p.credit_value,
          CASE 
            WHEN c.real_end_date < CURRENT_DATE THEN 'inactive'
            ELSE 'active'
          END AS status
        FROM students s
        LEFT JOIN branches b ON s.branch_id = b.id
        LEFT JOIN LATERAL (
          SELECT se.package_id, se.class_id
          FROM student_enrollments se
          WHERE se.student_id = s.id
          ORDER BY se.created_at DESC
          LIMIT 1
        ) latest_enroll ON true
        LEFT JOIN packages p ON p.id = latest_enroll.package_id
        LEFT JOIN classes c ON c.id = latest_enroll.class_id
        WHERE
          LOWER(s.full_name) LIKE $1 OR
          LOWER(s.nickname) LIKE $1 OR
          LOWER(s.parent_name) LIKE $1 OR
          s.phone_number LIKE $1
        ORDER BY s.id`;
        
      const values = [searchTerm];

      if (limitNumber) {
        query += ` LIMIT $2 OFFSET $3`;
        values.push(limitNumber, offset);
      }
      const result = await pool.query(query, values);
      res.status(200).json(result.rows);
    } catch (err) {
      console.error('Error fetching students:', err);
      res.status(500).json({ error: err.message });
    }
  });
  

// READ ONE
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM students WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Student not found' });
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE
router.put('/:id', async (req, res) => {
  try {
    const fields = [
      'full_name', 'birthdate', 'nickname', 'gender', 'current_school', 'phone_number',
      'daily_language', 'address', 'city_id', 'city_name', 'province_id', 'province_name',
      'branch_id', 'parent_name', 'parent_birthdate', 'parent_id_number', 'parent_occupation',
      'parent_address', 'parent_city', 'parent_city_id', 'parent_province',
      'parent_province_id', 'parent_source_of_info', 'form_filler', 'status'
    ];
    const updates = fields.map((field, i) => `${field} = $${i + 1}`).join(', ');
    const values = fields.map(f => req.body[f]);

    const result = await pool.query(
      `UPDATE students SET ${updates} WHERE id = $${fields.length + 1} RETURNING *`,
      [...values, req.params.id]
    );

    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM students WHERE id = $1', [req.params.id]);
    res.status(200).json({ message: 'Student deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
