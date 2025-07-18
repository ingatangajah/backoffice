const express = require('express');
const router = express.Router();
const pool = require('../db');

// Helper untuk validasi tanggal
const isValidDateRange = (start, end) =>
  start && end && start.trim() !== '' && end.trim() !== '';

// STUDENT PER PACKAGE
router.get('/student-per-package', async (req, res) => {
  try {
    const start_date = req.query.start_date?.trim();
    const end_date = req.query.end_date?.trim();

    let query = `
      SELECT 
        p.name AS package_name, 
        COUNT(se.student_id) AS total_students
      FROM student_enrollments se
      JOIN packages p ON se.package_id = p.id
    `;
    const values = [];

    if (isValidDateRange(start_date, end_date)) {
      query += ` WHERE se.created_at::date BETWEEN $1 AND $2`;
      values.push(start_date, end_date);
    }

    query += ` GROUP BY se.package_id, p.name ORDER BY p.name ASC`;

    const result = await pool.query(query, values);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching total student:', error);
    res.status(500).json({ error: 'Failed to fetch total student' });
  }
});

// TOTAL ACTIVE STUDENT
router.get('/total-active-student', async (req, res) => {
  try {
    const start_date = req.query.start_date?.trim();
    const end_date = req.query.end_date?.trim();

    let query = `
      SELECT COUNT(*) AS total_students
      FROM students
      WHERE status = 'ACTIVE'
    `;
    const values = [];

    if (isValidDateRange(start_date, end_date)) {
      query += ` AND created_at::date BETWEEN $1 AND $2`;
      values.push(start_date, end_date);
    }

    const result = await pool.query(query, values);

    res.json({
      total_students: parseInt(result.rows[0].total_students, 10),
      period: isValidDateRange(start_date, end_date) ? [start_date, end_date] : null,
    });
  } catch (error) {
    console.error('Error getting total students:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// TOTAL NEW STUDENT MONTH
router.get('/total-new-student-month', async (req, res) => {
  try {
    const start_date = req.query.start_date?.trim();
    const end_date = req.query.end_date?.trim();

    let query = `
      SELECT COUNT(*) AS total_students
      FROM students
    `;
    const values = [];

    if (isValidDateRange(start_date, end_date)) {
      query += ` WHERE created_at::date BETWEEN $1 AND $2`;
      values.push(start_date, end_date);
    }

    const result = await pool.query(query, values);

    res.json({
      total_students: parseInt(result.rows[0].total_students, 10),
      period: isValidDateRange(start_date, end_date) ? [start_date, end_date] : null,
    });
  } catch (error) {
    console.error('Error getting total students:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// TOTAL NEW STUDENT WEEK (default to current week)
router.get('/total-new-student-week', async (req, res) => {
  try {
    let start_date = req.query.start_date?.trim();
    let end_date = req.query.end_date?.trim();

    // Default ke minggu ini jika kosong
    if (!isValidDateRange(start_date, end_date)) {
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 = Sunday
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

      const monday = new Date(today);
      monday.setDate(today.getDate() + diffToMonday);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      start_date = monday.toISOString().slice(0, 10);
      end_date = sunday.toISOString().slice(0, 10);
    }

    const query = `
      SELECT COUNT(*) AS total_students
      FROM students
      WHERE created_at::date BETWEEN $1 AND $2;
    `;
    const values = [start_date, end_date];

    const result = await pool.query(query, values);

    res.json({
      total_students: parseInt(result.rows[0].total_students, 10),
      period: [start_date, end_date],
    });
  } catch (error) {
    console.error('Error getting total students:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// STUDENTS SUMMARY BY MONTH
router.get('/students-summary-by-month', async (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    const { status } = req.query;

    let query = `
      SELECT
        TO_CHAR(s.created_at, 'Mon') AS month,
        EXTRACT(MONTH FROM s.created_at) AS month_number,
        COUNT(*) AS total_students
      FROM students s
      WHERE EXTRACT(YEAR FROM s.created_at) = $1
    `;
    const values = [year];
    let idx = 2;

    if (status && ['active', 'inactive'].includes(status)) {
      query += ` AND status = $${idx++}`;
      values.push(status);
    }

    query += ` GROUP BY month, month_number ORDER BY month_number ASC`;

    const result = await pool.query(query, values);

    res.json({ data: result.rows });
  } catch (error) {
    console.error('Error fetching monthly summary:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// STUDENT PER BRANCH
router.get('/student-per-branch', async (req, res) => {
  try {
    const start_date = req.query.start_date?.trim();
    const end_date = req.query.end_date?.trim();

    let query = `
      SELECT 
        b.name AS branch_name,
        COUNT(*) AS total_students
      FROM students s
      JOIN branches b ON s.branch_id = b.id
      GROUP BY b.name
    `;
    const values = [];

    if (isValidDateRange(start_date, end_date)) {
      query += ` WHERE se.created_at::date BETWEEN $1 AND $2`;
      values.push(start_date, end_date);
    }

    query += ` GROUP BY b.id, b.name ORDER BY b.name ASC`;

    const result = await pool.query(query, values);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching total student:', error);
    res.status(500).json({ error: 'Failed to fetch total student' });
  }
});

router.get('/completed-levels-daily', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        TO_CHAR(sa.attended_date, 'Day') AS day_name,
        DATE(sa.attended_date) AS day_date,
        COUNT(DISTINCT se.student_id) AS completed_count
      FROM student_enrollments se
      JOIN packages p ON se.package_id = p.id
      JOIN student_attendances sa ON sa.student_id = se.student_id AND sa.class_id = se.class_id
      WHERE sa.attended_date >= date_trunc('week', CURRENT_DATE)
      GROUP BY day_date, day_name, se.student_id, p.credit_value
      HAVING COUNT(*) >= p.credit_value
    `);

    // transform hasil ke label & data
    const labelMap = {
      Sun: 'Minggu',
      Mon: 'Senin',
      Tue: 'Selasa',
      Wed: 'Rabu',
      Thu: 'Kamis',
      Fri: 'Jumat',
      Sat: 'Sabtu'
    }

    // Agregasi manual karena banyak row per siswa
    const dayCountMap = {}
    result.rows.forEach(row => {
      const d = new Date(row.day_date)
      const day = d.toLocaleDateString('id-ID', { weekday: 'long' })
      if (!dayCountMap[day]) dayCountMap[day] = 0
      dayCountMap[day] += 1
    })

    const labels = Object.keys(dayCountMap)
    const data = Object.values(dayCountMap)

    res.json({ labels, data })
  } catch (err) {
    console.error('Error fetching completed levels by day:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
