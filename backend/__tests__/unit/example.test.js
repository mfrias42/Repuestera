/**
 * Test de ejemplo para verificar que Jest está configurado correctamente
 * Este archivo puede eliminarse una vez que se implementen tests reales
 */

describe('Configuración de Jest', () => {
  test('debería ejecutar tests correctamente', () => {
    expect(true).toBe(true);
  });

  test('debería tener acceso a variables de entorno de test', () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.JWT_SECRET).toBeDefined();
  });

  test('debería poder hacer operaciones matemáticas', () => {
    const result = 2 + 2;
    expect(result).toBe(4);
  });
});

