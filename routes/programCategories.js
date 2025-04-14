const express = require('express');
const router = express.Router();
const pool = require('../db');

// CREATE: Tambah kategori program
router.post('/', async (req, res) => {
  const { label } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO program_categories (label) VALUES ($1) RETURNING *',
      [label]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// READ: Ambil semua kategori
router.get('/', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM program_categories ORDER BY id ASC');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// READ: Ambil kategori berdasarkan ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM program_categories WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

// UPDATE: Perbarui label kategori
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { label } = req.body;
  try {
    const result = await pool.query(
      'UPDATE program_categories SET label = $1 WHERE id = $2 RETURNING *',
      [label, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// DELETE: Hapus kategori berdasarkan ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM program_categories WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

module.exports = router;