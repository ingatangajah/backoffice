const express = require('express');
const router = express.Router();
const pool = require('../db');

// CREATE class
router.post('/', async (req, res) => {
  const {
    class_name, teacher_id, package_id, level, start_date,
    original_end_date, real_end_date, time_start,
    notification_time_1, notification_time_2,
    learning_method, location, language, pic
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO classes (
        class_name, teacher_id, package_id, level,
        start_date, original_end_date, real_end_date,
        time_start, notification_time_1, notification_time_2,
        learning_method, location, language, pic
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14
      ) RETURNING *`,
      [
        class_name, teacher_id, package_id, level,
        start_date, original_end_date, real_end_date,
        time_start, notification_time_1, notification_time_2,
        learning_method, location, language, pic
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating class:', error);
    res.status(500).json({ error: 'Failed to create class' });
  }
});

// READ all classes (with JOIN info)
router.get('/', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.*, 
        t.full_name AS teacher_name,
        p.name AS package_name
      FROM classes c
      LEFT JOIN teachers t ON c.teacher_id = t.id
      LEFT JOIN packages p ON c.package_id = p.id
      ORDER BY c.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

// GET by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        c.*, 
        t.full_name AS teacher_name,
        p.name AS package_name
       FROM classes c
       LEFT JOIN teachers t ON c.teacher_id = t.id
       LEFT JOIN packages p ON c.package_id = p.id
       WHERE c.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Class not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error getting class by ID:', error);
    res.status(500).json({ error: 'Failed to fetch class' });
  }
});

// UPDATE class
router.put('/:id', async (req, res) => {
  const {
    class_name, teacher_id, package_id, level, start_date,
    original_end_date, real_end_date, time_start,
    notification_time_1, notification_time_2,
    learning_method, location, language, pic
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE classes SET
        class_name=$1, teacher_id=$2, package_id=$3, level=$4,
        start_date=$5, original_end_date=$6, real_end_date=$7,
        time_start=$8, notification_time_1=$9, notification_time_2=$10,
        learning_method=$11, location=$12, language=$13, pic=$14,
        updated_at=NOW()
       WHERE id=$15 RETURNING *`,
      [
        class_name, teacher_id, package_id, level, start_date,
        original_end_date, real_end_date, time_start,
        notification_time_1, notification_time_2,
        learning_method, location, language, pic,
        req.params.id
      ]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Class not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating class:', error);
    res.status(500).json({ error: 'Failed to update class' });
  }
});

// DELETE class
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM classes WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Class not found' });
    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Error deleting class:', error);
    res.status(500).json({ error: 'Failed to delete class' });
  }
});

module.exports = router;