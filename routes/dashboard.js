const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/student-per-package', async (_req, res) => {
  try {
    const result = await pool.query(`SELECT p.name AS package_name, COUNT(se.student_id) AS total_students
                                     FROM student_enrollments se
                                     JOIN packages p ON se.package_id = p.id
                                     GROUP BY se.package_id, p.name;`);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching total student:', error);
    res.status(500).json({ error: 'Failed to fetch total student' });
  }
});

router.get('/total-active-student', async (req, res) => {
    try {
        const now = new Date();
        const start_date = req.query.start_date || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
        const end_date = req.query.end_date || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

        const query = `
        SELECT COUNT(*) AS total_students
        FROM students
        WHERE status = 'ACTIVE';
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

router.get('/total-new-student-month', async (req, res) => {
    try {
        const now = new Date();
        const start_date = req.query.start_date || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
        const end_date = req.query.end_date || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

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
router.get('/total-new-student-week', async (req, res) => {
    try {
        const now = new Date();
        const day = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        const diffToMonday = day === 0 ? -6 : 1 - day;

        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() + diffToMonday);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        const start_date = req.query.start_date || startOfWeek.toISOString().slice(0, 10);
        const end_date = req.query.end_date || endOfWeek.toISOString().slice(0, 10);

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


module.exports = router;