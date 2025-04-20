const express = require('express');
const router = express.Router();
const pool = require('../db');

// CREATE: Tambah holiday
router.post('/', async (req, res) => {
  const { description, holiday_date } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO holidays (description, holiday_date) VALUES ($1, $2) RETURNING *',
      [description, holiday_date]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating holiday:', error);
    res.status(500).json({ error: 'Failed to create holiday' });
  }
});

// READ: Ambil semua holidays
router.get('/', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM holidays ORDER BY holiday_date ASC');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching holidays:', error);
    res.status(500).json({ error: 'Failed to fetch holidays' });
  }
});

// READ: Ambil holiday berdasarkan ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('SELECT * FROM holidays WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Holiday not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching holiday:', error);
    res.status(500).json({ error: 'Failed to fetch holiday' });
  }
});

// UPDATE: Update holiday berdasarkan ID
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { description, holiday_date } = req.body;

  try {
    const result = await pool.query(
      `UPDATE holidays
       SET description = $1, holiday_date = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [description, holiday_date, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Holiday not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error updating holiday:', error);
    res.status(500).json({ error: 'Failed to update holiday' });
  }
});

// DELETE: Hapus holiday
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM holidays WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Holiday not found' });
    }
    res.status(200).json({ message: 'Holiday deleted successfully' });
  } catch (error) {
    console.error('Error deleting holiday:', error);
    res.status(500).json({ error: 'Failed to delete holiday' });
  }
});

module.exports = router;
