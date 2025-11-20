// Tests simples para routes/test-simple.js

const request = require('supertest');
const express = require('express');

jest.mock('mysql2/promise', () => ({
  createConnection: jest.fn()
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn()
}));

const testRoutes = require('../../../routes/test-simple');

const app = express();
app.use(express.json());
app.use('/api/test', testRoutes);

describe('Test Simple Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/test', () => {
    it('debe retornar mensaje de prueba', async () => {
      const response = await request(app)
        .get('/api/test');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Test endpoint funcionando');
      expect(response.body.status).toBe('OK');
      expect(response.body.timestamp).toBeDefined();
    });
  });
});

