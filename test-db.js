const pool = require('./db');

(async () => {
  try {
    // Perform a simple query to test the connection
    const res = await pool.query('SELECT 1 + 1 AS result');
    console.log('Database Connection Successful!');
    console.log('Query Result:', res.rows); // Access the `rows` property for query results
  } catch (error) {
    console.error('Error connecting to the database:', error.message);
  } finally {
    // End the pool to close the database connection
    await pool.end();
  }
})();
