const { sendEmail } = require('../utils/email');
const pool = require('../db');
const { generateToken } = require('../utils/jwt');

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // Check if the email exists in the database
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);

    if (result.rows.length === 0) {
      // Email not found
      return res.status(404).send({ error: 'User not found' });
    }

    const user = result.rows[0];

    // Generate a reset token
    const resetToken = generateToken({ id: user.id, email: user.email }, '15m');

    // Save the reset token in the database
    const updateQuery = 'UPDATE users SET reset_token = $1, token_expiry = NOW() + interval \'15 minutes\' WHERE email = $2';
    await pool.query(updateQuery, [resetToken, email]);

    // Send the reset email
    await sendEmail(email, 'Password Reset', `Your reset token is: ${resetToken}`);
    res.status(200).send({ message: 'Password reset email sent' });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).send({ error: error.message });
  }
};

module.exports = forgotPassword;
