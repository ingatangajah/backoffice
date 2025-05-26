const express = require('express');
const router = express.Router();
const pool = require('../db');

// CREATE Branch
router.post('/', async (req, res) => {
  const { name, province_id, city_id, address, phone_number } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO branches (name, province_id, city_id, address, phone_number)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, province_id, city_id, address, phone_number]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating branch:', error);
    res.status(500).json({ error: 'Failed to create branch' });
  }
});

// READ All Branches
router.get('/', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM branches ORDER BY id ASC');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching branches:', error);
    res.status(500).json({ error: 'Failed to fetch branches' });
  }
});

// READ Single Branch by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM branches WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Branch not found' });
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching branch:', error);
    res.status(500).json({ error: 'Failed to fetch branch' });
  }
});

// UPDATE Branch
router.put('/:id', async (req, res) => {
  const { name, province_id, city_id, address, phone_number } = req.body;
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE branches
       SET name = $1, province_id = $2, city_id = $3, city_id = $4, city_id = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [name, province_id, city_id, address, phone_number, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Branch not found' });
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error updating branch:', error);
    res.status(500).json({ error: 'Failed to update branch' });
  }
});

// DELETE Branch
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM branches WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Branch not found' });
    res.status(200).json({ message: 'Branch deleted successfully' });
  } catch (error) {
    console.error('Error deleting branch:', error);
    res.status(500).json({ error: 'Failed to delete branch' });
  }
});

module.exports = router;