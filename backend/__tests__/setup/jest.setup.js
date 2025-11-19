// Configuración global para Jest
// Este archivo se ejecuta antes de cada test

// Mock de variables de entorno
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key_for_testing';
process.env.JWT_EXPIRES_IN = '1h';
process.env.DB_TYPE = 'mysql';
process.env.DB_HOST = 'localhost';
process.env.DB_USER = 'test_user';
process.env.DB_PASSWORD = 'test_password';
process.env.DB_NAME = 'test_db';
process.env.DB_PORT = '3306';

// Configurar console para tests (opcional - reducir ruido)
// console.log = jest.fn();
// console.error = jest.fn();
// console.warn = jest.fn();

// Timeout global para tests asíncronos
jest.setTimeout(10000);

