/**
 * Helper para crear mocks de mysql2/promise
 * Útil para tests de rutas que usan getConnection() directamente
 */

/**
 * Crea un mock completo de mysql2/promise con conexión y execute
 * @param {Function} mockExecuteFunction - Función mock para execute
 * @returns {Object} Mock configurado de mysql2/promise
 */
function createMysqlMock(mockExecuteFunction) {
  const mockConnection = {
    execute: mockExecuteFunction || jest.fn(),
    end: jest.fn().mockResolvedValue()
  };

  const mockCreateConnection = jest.fn().mockResolvedValue(mockConnection);

  return {
    mockConnection,
    mockCreateConnection,
    // Configuración para jest.mock
    mockConfig: {
      __esModule: true,
      createConnection: mockCreateConnection,
      default: {
        createConnection: mockCreateConnection
      }
    }
  };
}

/**
 * Configura el mock de mysql2/promise para usar en tests
 * @param {Function} mockExecuteFunction - Función mock para execute
 */
function setupMysqlMock(mockExecuteFunction) {
  const { mockConfig } = createMysqlMock(mockExecuteFunction);
  jest.mock('mysql2/promise', () => mockConfig);
  return createMysqlMock(mockExecuteFunction);
}

module.exports = {
  createMysqlMock,
  setupMysqlMock
};

