// Configuración global para tests
// Este archivo se ejecuta antes de cada test

// Configurar variables de entorno para tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key_for_testing_only';
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_USER = process.env.DB_USER || 'test_user';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'test_password';
process.env.DB_NAME = process.env.DB_NAME || 'repuestera_test_db';
process.env.DB_PORT = process.env.DB_PORT || '3306';

// Configurar timeout global para tests (si es necesario)
jest.setTimeout(10000);

// Suprimir console.log en CI para evitar ruido
if (process.env.CI === 'true') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: console.error, // Mantener errores visibles
  };
}
