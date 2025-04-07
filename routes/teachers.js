const express = require('express');
const pool = require('../db');

const router = express.Router();

// ✅ Create Teacher
router.post('/', async (req, res) => {
    try {
        const { full_name, email, birthdate, address, city_id, city_name, province_id, province_name, education } = req.body;

        // ✅ Fetch `city_name` and `province_name` if missing
        let finalCityName = city_name || null;
        let finalProvinceName = province_name || null;

        if (!finalCityName) {
            const cityResult = await pool.query('SELECT name FROM kota_kabupaten WHERE id = $1', [city_id]);
            finalCityName = cityResult.rows.length ? cityResult.rows[0].name : null;
        }

        if (!finalProvinceName) {
            const provinceResult = await pool.query('SELECT name FROM provinsi WHERE id = $1', [province_id]);
            finalProvinceName = provinceResult.rows.length ? provinceResult.rows[0].name : null;
        }

        // ✅ Check if user exists, create if not
        let userId;
        const userCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            userId = userCheck.rows[0].id;
        } else {
            const newUser = await pool.query(
                `INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id`,
                [full_name, email, birthdate.replace(/-/g, '')]
            );
            userId = newUser.rows[0].id;
        }

        // ✅ Insert Teacher
        const result = await pool.query(
            `INSERT INTO teachers (
                full_name, birthdate, address, city_id, city_name, province_id, province_name, education, users_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [full_name, birthdate, address, city_id, finalCityName, province_id, finalProvinceName, education, userId]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error adding teacher:', error);
        res.status(500).json({ error: error.message });
    }
});

// ✅ Read, Update, Delete follow same structure...
// (Full CRUD operations here)

module.exports = router;
