const jwt = require('jsonwebtoken');
const jwtSecret = 'your_jwt_secret'; // Replace with a secure secret key

const generateToken = (payload, expiresIn = '1h') => {
  return jwt.sign(payload, jwtSecret, { expiresIn });
};

module.exports = { generateToken };
