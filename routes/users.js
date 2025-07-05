const express = require('express');
const router = express.Router();
const pool = require('../db');

router.post('/', async (req, res) => {
  const { username, full_name, email, password, role_id, status } = req.body;
  const saltRounds = 10;
  const encrypted_password = bcrypt.hash(password, saltRounds);
  try {
    const result = await pool.query(
      `INSERT INTO users (username, name, email, password, role_id, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [username, full_name, email, encrypted_password, role_id, status]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

router.get('/', async (_req, res) => {
  try {
    const result = await pool.query(`SELECT u.id, u.username, u.name AS full_name, u.email, r.name AS role_name, u.status 
        FROM users u 
        JOIN roles r ON u.role_id = r.id
        WHERE deleted_at IS NULL AND role_id IN (1,4)
        ORDER BY u.created_at ASC`);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`SELECT u.id, u.username, u.name AS full_name, u.email, u.role_id, r.name AS role_name, u.status 
                                     FROM users u 
                                     JOIN roles r ON u.role_id = r.id 
                                     WHERE u.id = $1`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'users not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

router.put('/:id', async (req, res) => {
  const { username, full_name, email, password, role_id, status } = req.body;

  try {
    let query = `
      UPDATE users SET
        username = $1,
        name = $2,
        email = $3,
    `;
    let values = [username, full_name, email];
    let paramIndex = 4;

    if (password && password.trim() !== '') {
      // Jika password diisi, hash dulu
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      query += `password = $${paramIndex},`;
      values.push(hashedPassword);
      paramIndex++;
    }

    query += `
      role_id = $${paramIndex},
      status = $${paramIndex + 1},
      updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex + 2}
      RETURNING *;
    `;

    values.push(role_id, status, req.params.id);

    const result = await pool.query(query, values);

    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query(`UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`, [req.params.id]);
    res.status(200).json({ message: 'Archive deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
