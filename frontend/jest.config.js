module.exports = {
  // Entorno de pruebas
  testEnvironment: 'jsdom',
  
  // Configuración de cobertura
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'cobertura'],
  
  // Archivos a incluir en la cobertura
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/index.js',
    '!src/reportWebVitals.js',
    '!src/setupTests.js',
    '!**/node_modules/**',
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
  
  // Configuración adicional
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  
  // Manejo de imports de archivos estáticos
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(gif|ttf|eot|svg|png)$': '<rootDir>/__mocks__/fileMock.js'
  },
  
  // Configuración de Jest para React
  testMatch: ['**/__tests__/**/*.js?(x)', '**/?(*.)+(spec|test).js?(x)'],
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  }
};