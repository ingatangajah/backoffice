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
// const articlesRoutes = require('./routes/articles');
// const programCategoriesRoutes = require('./routes/programCategories');
const packageRoutes = require('./routes/packages');
const classRoutes = require('./routes/classes');
const branchRoutes = require('./routes/branches');


const app = express();

// Enable CORS
app.use(cors({
  origin: '*',
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
// app.use('/articles', articlesRoutes);
// app.use('/program-categories', programCategoriesRoutes);
app.use('/packages', packageRoutes);
app.use('/classes', classRoutes);
app.use('/branches', branchRoutes);


// Health check
app.get('/', (req, res) => {
  res.status(200).send('API is running with CORS enabled!');
});

module.exports = app;
