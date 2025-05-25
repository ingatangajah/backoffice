// routes/schedule.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { formatTime } = require('../utils/helper');

// GET /schedule?date=YYYY-MM-DD
router.get('/', async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'Missing date parameter' });

  // Determine day-of-week index: Sunday=0..Saturday=6
  const dow = new Date(date).getDay();

  try {
    // Fetch classes that occur on that day-of-week and within start and end dates
    const result = await pool.query(
      `SELECT
         t.id AS teacher_id,
         t.full_name AS teacher_name,
         c.time_start,
         c.class_name
       FROM classes c
       JOIN teachers t ON c.teacher_id = t.id
       WHERE EXTRACT(DOW FROM c.start_date) = $2
         AND c.start_date <= $1
         AND $1 <= COALESCE(c.real_end_date, c.original_end_date)
       ORDER BY t.id, c.time_start`,
      [date, dow]
    );

    // Determine unique sorted time slots
    const times = [...new Set(result.rows.map(r => r.time_start.toString()))].sort();
    const slotsTemplate = times.map(ts => {
      const [h, m] = ts.split(':');
      const start = new Date(0,0,0, +h, +m);
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      return `${formatTime(start)}-${formatTime(end)}`;
    });

    // Group by teacher and assign className to slots
    const map = new Map();
    result.rows.forEach(row => {
      const key = row.teacher_id;
      if (!map.has(key)) {
        map.set(key, {
          id: row.teacher_id,
          name: row.teacher_name,
          slots: slotsTemplate.map(time => ({ time, className: null }))
        });
      }
      const entry = map.get(key);
      const [h, m] = row.time_start.toString().split(':');
      const start = new Date(0,0,0, +h, +m);
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      const slotLabel = `${formatTime(row.time_start)}-${formatTime(end)}`;
      const slotObj = entry.slots.find(s => s.time === slotLabel);
      if (slotObj) slotObj.className = row.class_name;
    });

    res.json({ date, teachers: Array.from(map.values()) });
  } catch (err) {
    console.error('Error fetching schedule:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
