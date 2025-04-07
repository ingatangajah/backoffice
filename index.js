const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const register = require('./routes/register');
const login = require('./routes/login');
const forgotPassword = require('./routes/forgotPassword');
const studentRoutes = require('./routes/students');
const teachersRoutes = require('./routes/teachers');
const kotaKabupatenRoutes = require('./routes/kotaKabupaten');
const provinsiRoutes = require('./routes/provinsi');

const app = express();

// Enable CORS
app.use(cors({
  origin: '*', // Allow all origins (Change this in production for security)
  methods: 'GET,POST,PUT,DELETE,OPTIONS',
  allowedHeaders: 'Content-Type,Authorization'
}));

app.use(bodyParser.json());

app.post('/register', register);
app.post('/login', login);
app.post('/forgot-password', forgotPassword);
app.use('/students', studentRoutes);
app.use('/teachers', teachersRoutes);
app.use('/api/kota-kabupaten', kotaKabupatenRoutes);
app.use('/api/provinsi', provinsiRoutes);

// Health check route
app.get('/', (req, res) => {
  res.status(200).send('API is running with CORS enabled!');
});

// Start server only if not in a test environment
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
