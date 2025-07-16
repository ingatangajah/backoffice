const bcrypt = require('bcryptjs');
const pool = require('../db');
const { generateToken } = require('../utils/jwt');

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);

    if (result.rows.length === 0) {
      return res.status(401).send({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).send({ error: 'Invalid email or password' });
    }

    const token = generateToken({ id: user.id, email: user.email, role_id: user.role_id });
    res.status(200).send({ token, role_id: user.role_id });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

module.exports = login;
