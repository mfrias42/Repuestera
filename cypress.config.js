const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    // Base URL (puede ser sobreescrita por variable de entorno CYPRESS_BASE_URL)
    baseUrl: process.env.CYPRESS_BASE_URL || 'http://localhost:3000',
    
    // Configuración de espera y timeouts
    // Timeouts aumentados para entornos CI que pueden ser más lentos
    defaultCommandTimeout: process.env.CI ? 20000 : 10000,
    pageLoadTimeout: process.env.CI ? 120000 : 60000,
    requestTimeout: process.env.CI ? 20000 : 10000,
    responseTimeout: process.env.CI ? 60000 : 30000,
    
    // Configuración de video y screenshots
    video: true,
    videoCompression: 32,
    screenshotOnRunFailure: true,
    
    // Variables de entorno para tests
    env: {
      apiUrl: process.env.CYPRESS_API_URL || 'http://localhost:8000/api',
      // Credenciales de admin para tests
      adminEmail: 'admin@repuestera.com',
      adminPassword: 'admin123'
    },
    
    // Patron de archivos de test
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    
    // Reporter para CI/CD
    reporter: process.env.CI ? 'junit' : 'spec',
    reporterOptions: {
      mochaFile: 'cypress/results/cypress-results-[hash].xml',
      toConsole: true
    },
    
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
