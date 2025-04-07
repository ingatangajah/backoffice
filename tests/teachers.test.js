const request = require('supertest');
const app = require('../index'); // Import the app
const pool = require('../db'); // Import the database connection

describe('Teachers API Tests', () => {
  let createdTeacherId; // Variable to store the ID of a created teacher

  // Clean up the database before and after the test suite
  beforeAll(async () => {
    try {
      // Ensure the teachers table is clean before testing
      await pool.query('DELETE FROM teachers');
    } catch (error) {
      console.error('Error setting up test database:', error);
    }
  });

  afterAll(async () => {
    try {
      if (pool) {
        await pool.end(); // Close the database connection after all tests
      }
    } catch (error) {
      console.error('Error closing the database connection:', error);
    }
  });

  // Test creating a teacher
  it('should create a new teacher', async () => {
    const teacherData = {
      name: 'Jane Doe',
      birthdate: '1985-05-15',
      address: '123 Main St',
      province: 'Jakarta',
      province_id: 'JK01',
      city: 'South Jakarta',
      city_id: 'SJ101',
      education: 'Bachelor of Education',
    };

    const res = await request(app).post('/teachers').send(teacherData);

    expect(res.statusCode).toEqual(201);
    expect(res.body.name).toEqual(teacherData.name);
    expect(res.body.city).toEqual(teacherData.city);

    createdTeacherId = res.body.id; // Save the created teacher ID for further tests
  });

  // Test retrieving all teachers
  it('should retrieve all teachers', async () => {
    const res = await request(app).get('/teachers');

    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true); // Ensure the response is an array
    expect(res.body.length).toBeGreaterThan(0); // Ensure there is at least one teacher
  });

  // Test retrieving a teacher by ID
  it('should retrieve a teacher by ID', async () => {
    const res = await request(app).get(`/teachers/${createdTeacherId}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.id).toEqual(createdTeacherId);
    expect(res.body.name).toEqual('Jane Doe');
  });

  // Test updating a teacher
  it('should update a teacher by ID', async () => {
    const updatedTeacherData = {
      name: 'Jane Doe Updated',
      birthdate: '1985-05-15',
      address: '456 Updated St',
      province: 'Jakarta',
      province_id: 'JK02',
      city: 'Central Jakarta',
      city_id: 'CJ102',
      education: 'Master of Education',
    };

    const res = await request(app).put(`/teachers/${createdTeacherId}`).send(updatedTeacherData);

    expect(res.statusCode).toEqual(200);
    expect(res.body.name).toEqual(updatedTeacherData.name);
    expect(res.body.city).toEqual(updatedTeacherData.city);
  });

  // Test deleting a teacher
  it('should delete a teacher by ID', async () => {
    const res = await request(app).delete(`/teachers/${createdTeacherId}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toEqual('Teacher deleted successfully');

    // Verify that the teacher is deleted
    const getRes = await request(app).get(`/teachers/${createdTeacherId}`);
    expect(getRes.statusCode).toEqual(404); // Teacher should no longer exist
  });
});
