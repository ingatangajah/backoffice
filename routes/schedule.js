// routes/schedule.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { formatTime } = require('../utils/helper');

router.get('/', async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'Missing date parameter' });

  try {
    // Determine day-of-week index (0=Sun..6=Sat)
    const dow = new Date(date).getDay();

    // Fetch classes with package duration
    const result = await pool.query(
      `SELECT
         t.id AS teacher_id,
         t.full_name AS teacher_name,
         c.time_start,
         c.id AS class_id,
         c.class_id
         p.meeting_duration
       FROM classes c
       JOIN teachers t ON c.teacher_id = t.id
       JOIN packages p ON c.package_id = p.id
       WHERE EXTRACT(DOW FROM c.start_date) = $2
         AND c.start_date <= $1
         AND $1 <= COALESCE(c.real_end_date, c.original_end_date)
       ORDER BY t.id, c.time_start`,
      [date, dow]
    );
    const rows = result.rows;

    // Build unique slot labels at 30-min intervals
    const slotSet = new Set();
    rows.forEach(r => {
      const [h, m] = r.time_start.split(':');
      const startBase = new Date(0, 0, 0, +h, +m);
      const count = Math.ceil(r.meeting_duration / 30);
      for (let i = 0; i < count; i++) {
        const s = new Date(startBase.getTime() + i * 30 * 60000);
        const e = new Date(s.getTime() + 30 * 60000);
        slotSet.add(`${formatTime(s)}-${formatTime(e)}`);
      }
    });
    const slotsTemplate = Array.from(slotSet).sort((a, b) => {
      const [aStart] = a.split('-');
      const [bStart] = b.split('-');
      return aStart.localeCompare(bStart);
    });

    // Group by teacher and fill slots
    const map = new Map();
    rows.forEach(r => {
      if (!map.has(r.teacher_id)) {
        map.set(r.teacher_id, {
          id: r.teacher_id,
          name: r.teacher_name,
          slots: slotsTemplate.map(time => ({ time, classId: null,className: null }))
        });
      }
      const entry = map.get(r.teacher_id);
      const [h, m] = r.time_start.split(':');
      const startBase = new Date(0, 0, 0, +h, +m);
      const count = Math.ceil(r.meeting_duration / 30);
      for (let i = 0; i < count; i++) {
        const s = new Date(startBase.getTime() + i * 30 * 60000);
        const e = new Date(s.getTime() + 30 * 60000);
        const label = `${formatTime(s)}-${formatTime(e)}`;
        const slotObj = entry.slots.find(s => s.time === label);
        if (slotObj) slotObj.className = r.class_name;
        if (slotObj) slotObj.classId = r.class_id;
      }
    });

    res.json({ date, teachers: Array.from(map.values()) });
  } catch (err) {
    console.error('Error fetching schedule:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
