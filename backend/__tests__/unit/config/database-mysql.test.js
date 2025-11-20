// Tests básicos para config/database-mysql.js
// Verificar que las funciones existen y se pueden llamar

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

const dbModule = require('../../../config/database-mysql');

describe('Database MySQL Config', () => {
  describe('Module exports', () => {
    it('debe exportar getConnection', () => {
      expect(typeof dbModule.getConnection).toBe('function');
    });

    it('debe exportar testConnection', () => {
      expect(typeof dbModule.testConnection).toBe('function');
    });

    it('debe exportar executeQuery', () => {
      expect(typeof dbModule.executeQuery).toBe('function');
    });

    it('debe exportar executeTransaction', () => {
      expect(typeof dbModule.executeTransaction).toBe('function');
    });

    it('debe exportar initializeTables', () => {
      expect(typeof dbModule.initializeTables).toBe('function');
    });

    it('debe exportar closeConnection', () => {
      expect(typeof dbModule.closeConnection).toBe('function');
    });
  });
});

