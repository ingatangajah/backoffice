const express = require('express');
const pool = require('../db');

const router = express.Router();

// ✅ Create Student
router.post('/', async (req, res) => {
    try {
        const {
            full_name, email, birthdate, nickname, gender, current_school, phone_number, daily_language,
            address, city_id, city_name, province_id, province_name, branch_id,
            parent_name, parent_birthdate, parent_id_number, parent_occupation,
            parent_address, parent_city_id, parent_city, parent_province_id, parent_province,
            parent_same_address, parent_source_of_info
        } = req.body;

        // ✅ Fetch `city_name` and `province_name` if missing
        let finalCityName = city_name || null;
        let finalProvinceName = province_name || null;
        let finalParentCityName = parent_city || null;
        let finalParentProvinceName = parent_province || null;

        if (!finalCityName) {
            const cityResult = await pool.query('SELECT name FROM kota_kabupaten WHERE id = $1', [city_id]);
            finalCityName = cityResult.rows.length ? cityResult.rows[0].name : null;
        }

        if (!finalProvinceName) {
            const provinceResult = await pool.query('SELECT name FROM provinsi WHERE id = $1', [province_id]);
            finalProvinceName = provinceResult.rows.length ? provinceResult.rows[0].name : null;
        }

        if (!finalParentCityName) {
            const parentCityResult = await pool.query('SELECT name FROM kota_kabupaten WHERE id = $1', [parent_city_id]);
            finalParentCityName = parentCityResult.rows.length ? parentCityResult.rows[0].name : null;
        }

        if (!finalParentProvinceName) {
            const parentProvinceResult = await pool.query('SELECT name FROM provinsi WHERE id = $1', [parent_province_id]);
            finalParentProvinceName = parentProvinceResult.rows.length ? parentProvinceResult.rows[0].name : null;
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

        // ✅ Insert Student
        const result = await pool.query(
            `INSERT INTO students (
                full_name, birthdate, nickname, gender, current_school, phone_number, daily_language,
                address, city_id, city_name, province_id, province_name, branch_id, parent_name, 
                parent_birthdate, parent_id_number, parent_occupation, parent_address, parent_city_id,
                parent_city, parent_province_id, parent_province, parent_same_address, 
                parent_source_of_info, users_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 
                      $18, $19, $20, $21, $22, $23, $24, $25) RETURNING *`,
            [
                full_name, birthdate, nickname, gender, current_school, phone_number, daily_language,
                address, city_id, finalCityName, province_id, finalProvinceName, branch_id, parent_name,
                parent_birthdate, parent_id_number, parent_occupation, parent_address, parent_city_id,
                finalParentCityName, parent_province_id, finalParentProvinceName, parent_same_address,
                parent_source_of_info, userId
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error adding student:', error);
        res.status(500).json({ error: error.message });
    }
});

// ✅ Read, Update, Delete follow same structure...
// (Full CRUD operations here)

module.exports = router;