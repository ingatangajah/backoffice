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
      package_id, last_education_place, daily_language, join_with_ig, education_level, role,
      url_registration_code
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
        province_id, province_name, users_id, branch_id, last_education_place,
        daily_language, join_with_ig, education_level, role, url_registration_code
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18
      ) RETURNING *`,
      [
        full_name, birthdate, nickname, gender, phone_number, address, city_id, city_name,
        province_id, province_name, users_id, branch_id, last_education_place,
        daily_language, join_with_ig, education_level, role, url_registration_code
      ]
    );

    const teacher = result.rows[0];
    // Insert ke package_teacher
    if (package_ids && package_ids.length > 0) {
      const insertValues = package_ids.map((pkgId) => `(${teacher.id}, ${pkgId})`).join(',');
      await pool.query(
        `INSERT INTO package_teacher (teacher_id, package_id) VALUES ${insertValues}`
      );
    }

    res.status(201).json(teacher);
  } catch (err) {
    console.error('Error creating teacher:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  const { page = 1, search, limit } = req.query;

  const parsedLimit = limit ? parseInt(limit, 10) : null;
  const parsedPage = parseInt(page, 10);
  const offset = parsedLimit ? (parsedPage - 1) * parsedLimit : 0;

  let baseQuery = `
    SELECT 
      t.*,
      u.email,
      u.role_id,
      r.name AS role_name,
      b.name AS branch_name,
      GROUP_CONCAT(p.name SEPARATOR ', ') AS package_names
    FROM teachers t
    LEFT JOIN users u ON t.users_id = u.id
    LEFT JOIN roles r ON u.role_id = r.id
    LEFT JOIN branches b ON t.branch_id = b.id
    LEFT JOIN package_teacher pt ON pt.teacher_id = t.id
    LEFT JOIN packages p ON pt.package_id = p.id
    GROUP BY t.id
  `;

  let whereClause = 'WHERE t.deleted_at IS NULL';
  const values = [];
  let paramIndex = 1;

  if (search && search.trim() !== '') {
    const searchQuery = `%${search.toLowerCase()}%`;
    whereClause = `
      WHERE 
        LOWER(t.full_name) LIKE $${paramIndex} OR
        LOWER(t.nickname) LIKE $${paramIndex} OR
        LOWER(u.email) LIKE $${paramIndex} OR
        t.phone_number LIKE $${paramIndex}
    `;
    values.push(searchQuery);
    paramIndex++;
  }

  if (parsedLimit !== null) {
    baseQuery += `
      ${whereClause}
      ORDER BY t.id ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    values.push(parsedLimit, offset);
  } else {
    baseQuery += `
      ${whereClause}
      ORDER BY t.id ASC
    `;
  }

  try {
    const result = await pool.query(baseQuery, values);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching teachers:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/archive-data', async (req, res) => {
  const { page = 1, search, limit } = req.query;

  const parsedLimit = limit ? parseInt(limit, 10) : null;
  const parsedPage = parseInt(page, 10);
  const offset = parsedLimit ? (parsedPage - 1) * parsedLimit : 0;

  let baseQuery = `
    SELECT 
      t.*,
      u.email,
      u.role_id,
      r.name AS role_name,
      b.name AS branch_name,
      GROUP_CONCAT(p.name SEPARATOR ', ') AS package_names
    FROM teachers t
    LEFT JOIN users u ON t.users_id = u.id
    LEFT JOIN roles r ON u.role_id = r.id
    LEFT JOIN branches b ON t.branch_id = b.id
    LEFT JOIN package_teacher pt ON pt.teacher_id = t.id
    LEFT JOIN packages p ON pt.package_id = p.id
    GROUP BY t.id;
  `;

  let whereClause = 'WHERE t.deleted_at IS NOT NULL';
  const values = [];
  let paramIndex = 1;

  if (search && search.trim() !== '') {
    const searchQuery = `%${search.toLowerCase()}%`;
    whereClause += `
      AND ( 
        LOWER(t.full_name) LIKE $${paramIndex} OR
        LOWER(t.nickname) LIKE $${paramIndex} OR
        LOWER(u.email) LIKE $${paramIndex} OR
        t.phone_number LIKE $${paramIndex}
      )
    `;
    values.push(searchQuery);
    paramIndex++;
  }

  if (parsedLimit !== null) {
    baseQuery += `
      ${whereClause}
      ORDER BY t.id ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    values.push(parsedLimit, offset);
  } else {
    baseQuery += `
      ${whereClause}
      ORDER BY t.id ASC
    `;
  }

  try {
    const result = await pool.query(baseQuery, values);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching teachers:', err);
    res.status(500).json({ error: err.message });
  }
});  

// READ ONE
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`SELECT 
        t.*,
        u.email,
        b.name AS branch_name,
        GROUP_CONCAT(p.name SEPARATOR ', ') AS package_names
      FROM teachers t
      LEFT JOIN users u ON t.users_id = u.id
      LEFT JOIN branches b ON t.branch_id = b.id
      LEFT JOIN package_teacher pt ON pt.teacher_id = t.id
      LEFT JOIN packages p ON pt.package_id = p.id
      WHERE t.id = $1
      GROUP BY t.id;`, [req.params.id]);
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
    const {
      full_name, birthdate, nickname, gender,
      phone_number, address, city_id, city_name,
      province_id, province_name, branch_id,
      package_ids,
      last_education_place, daily_language, join_with_ig, education_level, role,
      url_registration_code
    } = req.body;

    const teacherId = req.params.id;

    await pool.query(
      `UPDATE teachers SET
        full_name = $1, birthdate = $2, nickname = $3, gender = $4,
        phone_number = $5, address = $6, city_id = $7, city_name = $8,
        province_id = $9, province_name = $10, branch_id = $11,
        last_education_place = $12, daily_language = $13, join_with_ig = $14,
        education_level = $15, role = $16, url_registration_code = $17
      WHERE id = $18`,
      [
        full_name, birthdate, nickname, gender,
        phone_number, address, city_id, city_name,
        province_id, province_name, branch_id,
        last_education_place, daily_language, join_with_ig,
        education_level, role, url_registration_code,
        teacherId
      ]
    );

    // Update package_teacher
    await pool.query('DELETE FROM package_teacher WHERE teacher_id = $1', [teacherId]);

    if (package_ids && package_ids.length > 0) {
      const insertValues = package_ids.map((pkgId) => `(${teacherId}, ${pkgId})`).join(',');
      await pool.query(
        `INSERT INTO package_teacher (teacher_id, package_id) VALUES ${insertValues}`
      );
    }

    res.status(200).json({ message: 'Teacher updated' });
  } catch (err) {
    console.error('Error updating teacher:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE
// router.delete('/:id', async (req, res) => {
//   try {
//     await pool.query('DELETE FROM teachers WHERE id = $1', [req.params.id]);
//     res.status(200).json({ message: 'Teacher deleted successfully' });
//   } catch (err) {
//     console.error('Error deleting teacher:', err);
//     res.status(500).json({ error: err.message });
//   }
// });

// Archive
router.delete('/:id', async (req, res) => {
  try {
    await pool.query(`UPDATE teachers SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`, [req.params.id]);
    res.status(200).json({ message: 'Teacher Archived successfully' });
  } catch (err) {
    console.error('Error Archived teacher:', err);
    res.status(500).json({ error: err.message });
  }
});

// Class List
router.get('/:id/classes', async (req, res) => {
  try {
    const result = await pool.query(`SELECT
         c.id   AS class_id,
         c.time_start,
         c.class_name
       FROM teachers t
       JOIN classes c ON c.teacher_id = t.id
       JOIN packages p ON c.package_id = p.id
       WHERE t.id = $1`, [req.params.id])
    if (result.rows.length === 0) return res.status(200).json([]);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error get class of teacher:', err);
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;
