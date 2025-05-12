// routes/attendances.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// 1. CREATE Attendance for multiple students
router.post('/', async (req, res) => {
  const { class_id, student_ids } = req.body;
  const attended_date = new Date().toISOString().split('T')[0];

  try {
    const insertPromises = student_ids.map(student_id =>
      pool.query(
        `INSERT INTO student_attendances (student_id, class_id, attended_date)
         VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING`,
        [student_id, class_id, attended_date]
      )
    );

    await Promise.all(insertPromises);
    res.status(201).json({ message: 'Attendance recorded successfully' });
  } catch (error) {
    console.error('Error recording attendance:', error);
    res.status(500).json({ error: 'Failed to record attendance' });
  }
});

// 2. READ Attendance List in a Class with credit remaining
router.get('/class/:class_id', async (req, res) => {
  const { class_id } = req.params;

  try {
    const result = await pool.query(`
      SELECT
        s.id AS student_id,
        s.users_id,
        s.full_name,
        COALESCE(p.credit_value, 0) - COUNT(a.id) AS credit_remaining
      FROM student_enrollments se
      JOIN students s ON se.student_id = s.id
      LEFT JOIN classes c ON se.class_id = c.id
      LEFT JOIN packages p ON se.package_id = p.id
      LEFT JOIN student_attendances a ON a.student_id = s.id AND a.class_id = $1
      WHERE se.class_id = $1
      GROUP BY s.id, s.users_id, s.full_name, p.credit_value
      ORDER BY s.full_name ASC;
    `, [class_id]);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching attendance list:', error);
    res.status(500).json({ error: 'Failed to fetch attendance list' });
  }
});

module.exports = router;
