const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM kota_kabupaten ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM kota_kabupaten WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Kota/Kabupaten not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, provinsi_id } = req.body;
    const result = await pool.query(
      'INSERT INTO kota_kabupaten (name, provinsi_id) VALUES ($1, $2) RETURNING *',
      [name, provinsi_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, provinsi_id } = req.body;
    const result = await pool.query(
      'UPDATE kota_kabupaten SET name = $1, provinsi_id = $2 WHERE id = $3 RETURNING *',
      [name, provinsi_id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Kota/Kabupaten not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM kota_kabupaten WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Kota/Kabupaten not found' });
    }
    res.json({ message: 'Kota/Kabupaten deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;