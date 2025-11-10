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
    '!**/scripts/**',
    '!**/config/**',          // Excluir configuración de DB
    '!**/auth-fixed.js',      // Archivo auxiliar
    '!**/debug.js',           // Archivo de debug
    '!**/test-simple.js',     // Archivo de prueba
    '!ecosystem.config.js'    // Config de PM2
  ],
  
  // Umbrales de cobertura requeridos para el TP7 (mínimo 70%)
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Configuración de reportes de cobertura
  collectCoverage: true,
  coverageReporters: ['text', 'lcov', 'cobertura'],
  coverageDirectory: 'coverage',
  
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
  
  // Reporters para resultados de tests
  reporters: process.env.CI === 'true' 
    ? ['default', ['jest-junit', {
        outputDirectory: process.env.JEST_JUNIT_OUTPUT_DIR || '.',
        outputName: process.env.JEST_JUNIT_OUTPUT_NAME || 'junit.xml',
        suiteName: 'Backend Tests',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: 'true'
      }]]
    : ['default'],
  
  // Configuración para CI/CD
  ci: process.env.CI === 'true',
  
  // Bail on first failure in CI
  bail: process.env.CI === 'true' ? 1 : 0,
  
  // Max workers para CI (optimizar velocidad)
  maxWorkers: process.env.CI === 'true' ? 2 : '50%'
};

