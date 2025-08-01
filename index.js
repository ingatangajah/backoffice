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
const enrollmentRoutes = require('./routes/enrollments');
const holidaysRoutes = require('./routes/holidays');
const studentClassHistoryRoutes = require('./routes/studentClassHistory');
const rolesRoutes = require('./routes/roles');
const attendanceRoutes = require('./routes/attendances');
const scheduleRoutes = require('./routes/schedule');
const invoiceRoutes = require('./routes/invoices')
const dashboardRoutes = require('./routes/dashboard')
const usersRoutes = require('./routes/users')

const app = express();

// Enable CORS
app.use(cors({
  origin: '*',
  methods: 'GET,POST,PUT,DELETE,OPTIONS',
  allowedHeaders: 'Content-Type,Authorization'
}));

app.use(bodyParser.json());

app.use('/student-classes-history', studentClassHistoryRoutes);
app.post('/register', register);
app.post('/login', login);
app.post('/forgot-password', forgotPassword);
app.use('/students', studentRoutes);
app.use('/teachers', teachersRoutes);
app.use('/kota-kabupaten', kotaKabupatenRoutes);
app.use('/provinsi', provinsiRoutes);
// app.use('/articles', articlesRoutes);
// app.use('/program-categories', programCategoriesRoutes);
app.use('/packages', packageRoutes);
app.use('/classes', classRoutes);
app.use('/branches', branchRoutes);
app.use('/enrollments', enrollmentRoutes);
app.use('/holidays', holidaysRoutes);
app.use('/roles', rolesRoutes);
app.use('/attendances', attendanceRoutes);
app.use('/schedule', scheduleRoutes);
app.use('/invoices', invoiceRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/users', usersRoutes);

// Health check
app.get('/', (req, res) => {
  res.status(200).send('API is running with CORS enabled!');
});

module.exports = app;
