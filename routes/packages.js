const express = require('express');
const router = express.Router();
const pool = require('../db');

// CREATE package
router.post('/', async (req, res) => {
  const { name, meeting_duration, language, package_level, credit_value, base_price } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO packages (name, meeting_duration, language, package_level, credit_value, base_price)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, meeting_duration, language, package_level, credit_value, base_price]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating package:', error);
    res.status(500).json({ error: 'Failed to create package' });
  }
});

// READ all packages
router.get('/', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM packages ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching packages:', error);
    res.status(500).json({ error: 'Failed to fetch packages' });
  }
});

// READ package by id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM packages WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Package not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching package:', error);
    res.status(500).json({ error: 'Failed to fetch package' });
  }
});

// UPDATE package
router.put('/:id', async (req, res) => {
  const { name, meeting_duration, language, package_level, credit_value, base_price } = req.body;

  try {
    const result = await pool.query(
      `UPDATE packages SET
        name = $1, meeting_duration = $2, language = $3, package_level = $4,
        credit_value = $5, base_price = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 RETURNING *`,
      [name, meeting_duration, language, package_level, credit_value, base_price, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Package not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating package:', error);
    res.status(500).json({ error: 'Failed to update package' });
  }
});

// DELETE package
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM packages WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Package not found' });
    res.json({ message: 'Package deleted successfully' });
  } catch (error) {
    console.error('Error deleting package:', error);
    res.status(500).json({ error: 'Failed to delete package' });
  }
});

module.exports = router;
