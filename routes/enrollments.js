const express = require('express');
const router = express.Router();
const pool = require('../db');

// POST - Student Enroll to Class
router.post('/', async (req, res) => {
  const { student_id, package_id, class_id } = req.body;
  try {
    // Validate package matching class
    const classResult = await pool.query('SELECT package_id FROM classes WHERE id = $1', [class_id]);
    if (classResult.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }
    if (classResult.rows[0].package_id !== package_id) {
      return res.status(400).json({ error: 'Package mismatch with selected class' });
    }

    const result = await pool.query(
      `INSERT INTO student_enrollments (student_id, package_id, class_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [student_id, package_id, class_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error enrolling student:', error);
    res.status(500).json({ error: 'Failed to enroll student' });
  }
});

// GET - Students in a Class
router.get('/class/:classId', async (req, res) => {
  const { classId } = req.params;
  try {
    const result = await pool.query(
      `SELECT se.*, s.full_name
       FROM student_enrollments se
       JOIN students s ON se.student_id = s.id
       WHERE se.class_id = $1`,
      [classId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching students by class:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// PUT - Move Student to another Class
router.put('/:id/move', async (req, res) => {
  const { id } = req.params;
  const { new_class_id } = req.body;
  try {
    const enrollment = await pool.query('SELECT * FROM student_enrollments WHERE id = $1', [id]);
    if (enrollment.rows.length === 0) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    const originalPackageId = enrollment.rows[0].package_id;

    const newClass = await pool.query('SELECT * FROM classes WHERE id = $1', [new_class_id]);
    if (newClass.rows.length === 0) {
      return res.status(404).json({ error: 'New class not found' });
    }

    if (newClass.rows[0].package_id !== originalPackageId) {
      return res.status(400).json({ error: 'Package mismatch: Cannot move to class with different package' });
    }

    const update = await pool.query(
      `UPDATE student_enrollments SET class_id = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [new_class_id, id]
    );

    res.json(update.rows[0]);
  } catch (error) {
    console.error('Error moving student:', error);
    res.status(500).json({ error: 'Failed to move student' });
  }
});

module.exports = router;