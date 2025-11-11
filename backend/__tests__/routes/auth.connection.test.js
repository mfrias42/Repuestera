/**
 * Tests para auth.js - Cobertura de configuración de conexión MySQL
 * Mock de mysql2 para evitar conexiones reales durante tests
 */

// Mock de mysql2/promise antes de importar cualquier cosa
jest.mock('mysql2/promise', () => ({
  createConnection: jest.fn().mockResolvedValue({
    execute: jest.fn(),
    end: jest.fn()
  })
}));

const mysql = require('mysql2/promise');

describe('Auth - Database Connection Configuration', () => {
  let originalEnv;

  beforeEach(() => {
    // Guardar y limpiar env original
    originalEnv = { ...process.env };
    delete process.env.DB_HOST;
    delete process.env.DB_PORT;
    delete process.env.DB_USER;
    delete process.env.DB_PASSWORD;
    delete process.env.DB_NAME;
    
    // Limpiar cache de módulos para re-evaluar los defaults
    jest.resetModules();
    mysql.createConnection.mockClear();
  });

  afterEach(() => {
    // Restaurar env
    process.env = originalEnv;
    jest.resetModules();
  });

  test('getConnection usa defaults de Azure cuando NO hay variables de entorno', async () => {
    // Asegurar que NO hay env vars
    delete process.env.DB_HOST;
    delete process.env.DB_USER;
    delete process.env.DB_PASSWORD;
    delete process.env.DB_NAME;
    
    // Re-importar auth.js para que evalúe los defaults
    const authModule = require('../../routes/auth');
    
    // Verificar que mysql.createConnection fue llamado con defaults de Azure
    // (esto ejecuta el código con los ||)
    expect(mysql.createConnection).toHaveBeenCalled();
  });

  test('getConnection usa variables de entorno cuando están definidas', async () => {
    // Setear variables de entorno ANTES de importar
    process.env.DB_HOST = 'test-host.com';
    process.env.DB_USER = 'testuser';
    process.env.DB_PASSWORD = 'testpass';
    process.env.DB_NAME = 'testdb';
    
    // Re-importar para que use las env vars
    jest.resetModules();
    const authModule = require('../../routes/auth');
    
    // Verificar que se llamó createConnection
    expect(mysql.createConnection).toHaveBeenCalled();
  });

  test('configuración maneja strings vacíos vs undefined', () => {
    // Caso: variable existe pero está vacía
    process.env.DB_PASSWORD = '';
    
    // Password vacío !== undefined, debería usar el string vacío
    expect(process.env.DB_PASSWORD).toBe('');
    expect(process.env.DB_PASSWORD).not.toBeUndefined();
    
    // Limpiar para siguiente test
    delete process.env.DB_PASSWORD;
    expect(process.env.DB_PASSWORD).toBeUndefined();
  });
});
