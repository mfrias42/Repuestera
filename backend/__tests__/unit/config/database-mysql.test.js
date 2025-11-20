// Tests básicos para config/database-mysql.js
// Solo verificamos que las funciones existen y se pueden llamar

jest.mock('mysql2/promise', () => ({
  createPool: jest.fn(() => ({
    execute: jest.fn(),
    getConnection: jest.fn(),
    end: jest.fn()
  }))
}));

jest.mock('dotenv', () => ({
  config: jest.fn()
}));

const {
  getConnection,
  testConnection,
  executeQuery,
  executeTransaction,
  closeConnection
} = require('../../../config/database-mysql');

describe('Database MySQL Config', () => {
  describe('Module exports', () => {
    it('debe exportar getConnection', () => {
      expect(typeof getConnection).toBe('function');
    });

    it('debe exportar testConnection', () => {
      expect(typeof testConnection).toBe('function');
    });

    it('debe exportar executeQuery', () => {
      expect(typeof executeQuery).toBe('function');
    });

    it('debe exportar executeTransaction', () => {
      expect(typeof executeTransaction).toBe('function');
    });

    it('debe exportar closeConnection', () => {
      expect(typeof closeConnection).toBe('function');
    });
  });
});

