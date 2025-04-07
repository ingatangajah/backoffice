const request = require('supertest');
const app = require('../index'); // Import the app
const pool = require('../db'); // Import the database connection
const { sendEmail } = require('../utils/email'); // Import the sendEmail function

// Mock sendEmail function using Jest
jest.mock('../utils/email', () => ({
  sendEmail: jest.fn(), // Mock sendEmail as a Jest mock function
}));

// Set up the database before tests
beforeAll(async () => {
  try {
    // Insert test users
    await pool.query(`
      INSERT INTO users (name, email, password) 
      VALUES 
        ('John Doe', 'john.doe@example.com', 'hashedpassword'),
        ('Test User', 'test@example.com', 'hashedpassword')
      ON CONFLICT (email) DO NOTHING
    `);
  } catch (error) {
    console.error('Error setting up test database:', error);
  }
});

// Test suite for API endpoints
describe('API Tests', () => {
  let token; // Variable to store the token for authenticated requests
  let createdStudentId; // Store the ID of a created student for further operations

  // Test the /register endpoint
  it('should not allow duplicate email registration', async () => {
    const res = await request(app)
      .post('/register')
      .send({
        name: 'John Doe',
        email: 'john.doe@example.com', // Duplicate email
        password: 'password123',
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toEqual('Email already exists');
  });

  // Test the /login endpoint
  it('should login an existing user and return a token', async () => {
    const res = await request(app)
      .post('/login')
      .send({
        email: 'john.doe@example.com',
        password: 'password123',
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
    token = res.body.token; // Save the token for further tests
  });

  // Test the /forgot-password endpoint
  it('should send a password reset email', async () => {
    // Mock sendEmail to resolve successfully
    sendEmail.mockResolvedValueOnce();

    const res = await request(app)
      .post('/forgot-password')
      .send({
        email: 'test@example.com', // Email must match the test user
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toEqual('Password reset email sent');
    expect(sendEmail).toHaveBeenCalledTimes(1); // Ensure sendEmail was called
    expect(sendEmail).toHaveBeenCalledWith(
      'test@example.com',
      'Password Reset',
      expect.stringContaining('Your reset token is:')
    );
  });

  // Test the /students endpoint
  describe('Students API Tests', () => {
    const mockStudent = {
      name: 'Jane Doe',
      birthdate: '2010-05-15',
      address: '123 Main St',
      city: 'New York',
      city_id: 'NYC101',
      province: 'New York',
      province_id: 'NY10',
      parent_name: 'John Doe',
      parent_birthdate: '1980-04-10',
      parent_id_number: '123456789',
      parent_occupation: 'Teacher',
      parent_address: '123 Main St',
      parent_city: 'New York',
      parent_city_id: 'NYC101',
      parent_province: 'New York',
      parent_province_id: 'NY10',
      users_id: null, // Optional
    };

    // Test creating a student
    it('should create a new student', async () => {
      const res = await request(app)
        .post('/students')
        .set('Authorization', `Bearer ${token}`) // Pass token if authentication is required
        .send(mockStudent);

      expect(res.statusCode).toEqual(201);
      expect(res.body.name).toEqual(mockStudent.name);
      expect(res.body.city).toEqual(mockStudent.city);
      createdStudentId = res.body.id; // Save the student ID for further tests
    });

    // Test retrieving all students
    it('should retrieve all students', async () => {
      const res = await request(app)
        .get('/students')
        .set('Authorization', `Bearer ${token}`); // Pass token if authentication is required

      expect(res.statusCode).toEqual(200);
      expect(res.body.length).toBeGreaterThan(0);
    });

    // Test retrieving a student by ID
    it('should retrieve a student by ID', async () => {
      const res = await request(app)
        .get(`/students/${createdStudentId}`)
        .set('Authorization', `Bearer ${token}`); // Pass token if authentication is required

      expect(res.statusCode).toEqual(200);
      expect(res.body.id).toEqual(createdStudentId);
      expect(res.body.name).toEqual(mockStudent.name);
    });

    // Test updating a student
    it('should update a student by ID', async () => {
      const updatedStudent = {
        ...mockStudent,
        name: 'Updated Jane Doe',
        city: 'Los Angeles',
      };

      const res = await request(app)
        .put(`/students/${createdStudentId}`)
        .set('Authorization', `Bearer ${token}`) // Pass token if authentication is required
        .send(updatedStudent);

      expect(res.statusCode).toEqual(200);
      expect(res.body.name).toEqual(updatedStudent.name);
      expect(res.body.city).toEqual(updatedStudent.city);
    });

    // Test deleting a student
    it('should delete a student by ID', async () => {
      const res = await request(app)
        .delete(`/students/${createdStudentId}`)
        .set('Authorization', `Bearer ${token}`); // Pass token if authentication is required

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toEqual('Student deleted successfully');

      // Verify that the student is deleted
      const getRes = await request(app)
        .get(`/students/${createdStudentId}`)
        .set('Authorization', `Bearer ${token}`); // Pass token if authentication is required

      expect(getRes.statusCode).toEqual(404);
    });
  });
});

// Cleanup logic to close the database connection
afterAll(async () => {
  try {
    if (pool) {
      await pool.end(); // Properly close the database connection
    }
  } catch (error) {
    console.error('Error closing the database connection:', error);
  }
});
