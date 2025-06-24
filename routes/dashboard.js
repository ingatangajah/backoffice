const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/student-per-package', async (req, res) => {
  try {
    const now = new Date();
    const start_date = req.query.start_date || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const end_date = req.query.end_date || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

    const query = `
      SELECT 
        p.name AS package_name, 
        COUNT(se.student_id) AS total_students
      FROM student_enrollments se
      JOIN packages p ON se.package_id = p.id
      WHERE se.created_at::date BETWEEN $1 AND $2
      GROUP BY se.package_id, p.name
      ORDER BY p.name ASC;
    `;

    const values = [start_date, end_date];
    const result = await pool.query(query, values);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching total student:', error);
    res.status(500).json({ error: 'Failed to fetch total student' });
  }
});

router.get('/total-active-student', async (req, res) => {
    try {
        const start_date = req.query.start_date?.trim();
        const end_date = req.query.end_date?.trim();

        const query = `
        SELECT COUNT(*) AS total_students
        FROM students
        WHERE status = 'ACTIVE';
        `;
        const values = [];

        if (start_date && end_date) {
            query += ` WHERE created_at::date BETWEEN $1 AND $2`;
            values = [start_date, end_date];
        }
            
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
        const start_date = (req.query.start_date && req.query.start_date.trim()) ||
                            new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);

        const end_date = (req.query.end_date && req.query.end_date.trim()) ||
                          new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

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
        let { start_date, end_date } = req.query;

        // Jika parameter tidak dikirim, default ke minggu ini (Senin - Minggu)
        if (!start_date || !end_date) {
            const today = new Date();
            const dayOfWeek = today.getDay(); // 0 = Minggu, 1 = Senin, ..., 6 = Sabtu

            // Geser ke Senin (1)
            const diffToMonday = (dayOfWeek === 0 ? -6 : 1 - dayOfWeek); 
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


module.exports = router;