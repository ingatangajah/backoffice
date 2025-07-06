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
      FROM student_enrollments se
      JOIN students s ON se.student_id = s.id
      JOIN branches b ON s.branch_id = b.id
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

module.exports = router;
