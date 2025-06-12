// routes/attendances.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// 1. CREATE Attendance for multiple students
router.post('/', async (req, res) => {
  const { class_id, students } = req.body;
  const attended_date = new Date().toISOString().split('T')[0];

  try {
    const insertPromises = students.map(({ student_id, presence }) =>
      pool.query(
        `INSERT INTO student_attendances (student_id, class_id, attended_date, presence)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (student_id, class_id, attended_date) DO UPDATE SET presence = EXCLUDED.presence_status`,
        [student_id, class_id, attended_date, presence]
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
        SELECT DISTINCT ON (s.id)
            s.id AS student_id,
            s.users_id,
            s.full_name,
            se.id AS enrollment_id,
            COALESCE(p.credit_value, 0) -
            (
                SELECT COUNT(*) 
                FROM student_attendances a 
                WHERE a.student_id = s.id AND a.class_id = $1
            ) AS credit_remaining
        FROM student_enrollments se
        JOIN students s ON se.student_id = s.id
        LEFT JOIN packages p ON se.package_id = p.id
        WHERE se.class_id = $1
        GROUP BY s.id, s.users_id, s.full_name, p.credit_value, se.id
        ORDER BY s.id, se.id DESC;
    `, [class_id]);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching attendance list:', error);
    res.status(500).json({ error: 'Failed to fetch attendance list' });
  }
});

module.exports = router;
