module.exports = {
  // Entorno de ejecución
  testEnvironment: 'node',
  
  // Directorios donde Jest buscará archivos de test
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],
  
  // Directorios a ignorar
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/'
  ],
  
  // Configuración de cobertura
  collectCoverageFrom: [
    '**/*.js',
    '!**/node_modules/**',
    '!**/__tests__/**',
    '!**/coverage/**',
    '!jest.config.js',
    '!server.js',
    '!**/scripts/**'
  ],
  
  // Umbrales de cobertura (opcional, se puede ajustar)
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },
  
  // Variables de entorno para tests
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
  
  // Tiempo máximo para cada test
  testTimeout: 10000,
  
  // Limpiar mocks entre tests
  clearMocks: true,
  
  // Restaurar mocks después de cada test
  restoreMocks: true,
  
  // Mostrar cobertura (se activa con flag --coverage)
  collectCoverage: false,
  
  // Reportes de cobertura
  coverageReporters: ['text', 'lcov', 'html', 'cobertura'],
  
  // Configuración para CI/CD
  ci: process.env.CI === 'true',
  
  // Bail on first failure in CI
  bail: process.env.CI === 'true' ? 1 : 0,
  
  // Max workers para CI (optimizar velocidad)
  maxWorkers: process.env.CI === 'true' ? 2 : '50%'
};

