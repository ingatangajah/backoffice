const express = require('express');
const router = express.Router();
const pool = require('../db');
const { addDurationToTime } = require('../utils/helper');

// CREATE class with auto-generate schedules
router.post('/', async (req, res) => {
    const {
      class_name, teacher_id, package_id, level, start_date,
      original_end_date, real_end_date, time_start,
      notification_time_1, notification_time_2,
      learning_method, location, language, pic
    } = req.body;
  
    const client = await pool.connect();
  
    try {
      await client.query('BEGIN');
  
      // Insert class
      const classResult = await client.query(
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
  
      const newClass = classResult.rows[0];
  
      // Get package info for credit_value
      const packageResult = await client.query(
        'SELECT credit_value FROM packages WHERE id = $1',
        [package_id]
      );
  
      if (packageResult.rows.length === 0) {
        throw new Error('Package not found');
      }
  
      const creditValue = packageResult.rows[0].credit_value;
      let currentScheduleDate = new Date(start_date);
      let createdSchedules = 0;
  
      while (createdSchedules < creditValue) {
        // Cek apakah date ini adalah holiday
        const holidayCheck = await client.query(
          'SELECT 1 FROM holidays WHERE holiday_date = $1',
          [currentScheduleDate.toISOString().split('T')[0]]
        );
  
        if (holidayCheck.rows.length === 0) {
          // Not a holiday -> create schedule
          await client.query(
            `INSERT INTO class_schedules (class_id, schedule_date, start_time, end_time)
             VALUES ($1, $2, $3, $4)`,
            [
              newClass.id,
              currentScheduleDate,
              time_start,
              addDurationToTime(time_start, 60) // Misal durasi meeting 1 jam
            ]
          );
          createdSchedules++;
        }
  
        // Increment by 7 days (next week)
        currentScheduleDate.setDate(currentScheduleDate.getDate() + 7);
      }
  
      await client.query('COMMIT');
  
      res.status(201).json(newClass);
  
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating class and schedules:', error);
      res.status(500).json({ error: error.message });
    } finally {
      client.release();
    }
  });

// READ all classes (with JOIN info)
router.get('/', async (req, res) => {
  const { package_id } = req.query;

  try {
    let query = `
      SELECT 
        c.*, 
        t.full_name AS teacher_name,
        p.name AS package_name
      FROM classes c
      LEFT JOIN teachers t ON c.teacher_id = t.id
      LEFT JOIN packages p ON c.package_id = p.id
    `;
    const params = [];

    if (package_id) {
      query += ` WHERE c.package_id = $1`;
      params.push(package_id);
    }

    query += ` ORDER BY c.created_at DESC`;

    const result = await pool.query(query, params);
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