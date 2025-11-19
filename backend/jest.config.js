module.exports = {
  // Entorno de testing
  testEnvironment: 'node',
  
  // Directorios y archivos de test
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],
  
  // Directorios a ignorar
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/dist/'
  ],
  
  // Configuración de cobertura
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  
  // Reporters para resultados de tests
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'coverage',
        outputName: 'junit.xml',
        suiteName: 'Backend Tests',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: 'true'
      }
    ]
  ],
  collectCoverageFrom: [
    '**/*.js',
    '!**/node_modules/**',
    '!**/__tests__/**',
    '!**/coverage/**',
    '!**/scripts/**',
    '!server.js',
    '!jest.config.js'
  ],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup/jest.setup.js'],
  
  // Transformaciones
  transform: {},
  
  // Módulos a mockear automáticamente
  automock: false,
  
  // Timeout para tests
  testTimeout: 10000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks entre tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};

