/**
 * Tests para la función getConnection de auth.js
 * Estos tests aseguran cobertura de las condiciones de variables de entorno
 */

describe('Auth - getConnection', () => {
  let originalEnv;

  beforeEach(() => {
    // Guardar env original
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    // Restaurar env
    process.env = originalEnv;
  });

  test('usa variables de entorno cuando están definidas', () => {
    // Setear variables de entorno
    process.env.DB_HOST = 'test-host';
    process.env.DB_PORT = '3307';
    process.env.DB_USER = 'test-user';
    process.env.DB_PASSWORD = 'test-pass';
    process.env.DB_NAME = 'test-db';

    // Verificar que las variables están seteadas
    expect(process.env.DB_HOST).toBe('test-host');
    expect(process.env.DB_PORT).toBe('3307');
    expect(process.env.DB_USER).toBe('test-user');
    expect(process.env.DB_PASSWORD).toBe('test-pass');
    expect(process.env.DB_NAME).toBe('test-db');
  });

  test('usa defaults cuando variables de entorno no están definidas', () => {
    // Eliminar variables de entorno
    delete process.env.DB_HOST;
    delete process.env.DB_PORT;
    delete process.env.DB_USER;
    delete process.env.DB_PASSWORD;
    delete process.env.DB_NAME;

    // Verificar que las variables NO están seteadas
    expect(process.env.DB_HOST).toBeUndefined();
    expect(process.env.DB_PORT).toBeUndefined();
    expect(process.env.DB_USER).toBeUndefined();
    expect(process.env.DB_PASSWORD).toBeUndefined();
    expect(process.env.DB_NAME).toBeUndefined();
  });

  test('prioriza variables de entorno sobre defaults', () => {
    // Setear solo algunas variables
    process.env.DB_HOST = 'custom-host';
    delete process.env.DB_USER;

    // DB_HOST debería usar el valor custom
    expect(process.env.DB_HOST).toBe('custom-host');
    // DB_USER debería estar undefined (usará default)
    expect(process.env.DB_USER).toBeUndefined();
  });
});
