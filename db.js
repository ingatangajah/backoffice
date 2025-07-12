const { Pool } = require('pg');

console.log('Connecting to:', process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Neon requires SSL, but disable cert verification
  },
});

module.exports = pool;
