// Tests simples para routes/debug.js

const request = require('supertest');
const express = require('express');

jest.mock('mysql2/promise', () => ({
  createConnection: jest.fn()
}));

jest.mock('bcryptjs', () => ({
  compare: jest.fn()
}));

const debugRoutes = require('../../../routes/debug');

const app = express();
app.use(express.json());
app.use('/api/debug', debugRoutes);

describe('Debug Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/debug/test', () => {
    it('debe retornar mensaje de prueba', async () => {
      const response = await request(app)
        .get('/api/debug/test');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Debug endpoint funcionando');
      expect(response.body.status).toBe('OK');
      expect(response.body.timestamp).toBeDefined();
    });
  });
});

