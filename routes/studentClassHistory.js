const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET historical classes based on student_id
router.get('/:student_id/class-history', async (req, res) => {
  const { student_id } = req.params;

  try {
    const result = await pool.query(`
      SELECT 
        students.full_name AS student_name,
        classes.class_name,
        classes.start_date,
        classes.original_end_date,
        classes.real_end_date,
        teachers.full_name AS teacher_name
      FROM student_enrollments
      JOIN classes ON student_enrollments.class_id = classes.id
      JOIN teachers ON classes.teacher_id = teachers.id
      JOIN students ON student_enrollments.student_id = students.id
      WHERE student_enrollments.student_id = $1
      ORDER BY classes.start_date ASC
    `, [student_id]);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching student class history:', error);
    res.status(500).json({ error: 'Failed to fetch class history' });
  }
});

module.exports = router;
