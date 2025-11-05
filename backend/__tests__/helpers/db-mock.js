/**
 * Helper para crear mocks de la base de datos
 * Útil para aislar tests de dependencias externas
 */

/**
 * Crea un mock de conexión MySQL
 * @param {Object} mockData - Datos mockeados para las queries
 * @returns {Object} Mock de pool de conexiones
 */
function createDbMock(mockData = {}) {
  const mockConnection = {
    execute: jest.fn((query, params) => {
      // Buscar el mock específico para esta query
      const queryKey = query.trim().toLowerCase();
      
      // Si hay un mock específico para esta query, usarlo
      if (mockData[queryKey]) {
        return Promise.resolve([mockData[queryKey]]);
      }
      
      // Si hay un mock genérico, usarlo
      if (mockData.default) {
        return Promise.resolve([mockData.default]);
      }
      
      // Retornar array vacío por defecto
      return Promise.resolve([[]]);
    }),
    end: jest.fn(() => Promise.resolve()),
    getConnection: jest.fn(() => Promise.resolve(mockConnection)),
    beginTransaction: jest.fn(() => Promise.resolve()),
    commit: jest.fn(() => Promise.resolve()),
    rollback: jest.fn(() => Promise.resolve()),
    release: jest.fn(() => Promise.resolve())
  };

  const mockPool = {
    execute: jest.fn((query, params) => {
      return mockConnection.execute(query, params);
    }),
    getConnection: jest.fn(() => Promise.resolve(mockConnection)),
    end: jest.fn(() => Promise.resolve())
  };

  return {
    pool: mockPool,
    connection: mockConnection
  };
}

/**
 * Crea un mock de executeQuery
 * @param {Array} results - Array de resultados para las queries
 * @returns {Function} Mock de executeQuery
 */
function createExecuteQueryMock(results = []) {
  let callIndex = 0;
  
  return jest.fn((query, params = []) => {
    if (callIndex < results.length) {
      return Promise.resolve(results[callIndex++]);
    }
    return Promise.resolve([]);
  });
}

module.exports = {
  createDbMock,
  createExecuteQueryMock
};

