const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    // Base URL (puede ser sobreescrita por variable de entorno CYPRESS_BASE_URL)
    baseUrl: process.env.CYPRESS_BASE_URL || 'http://localhost:3000',
    
    // Configuración de espera y timeouts
    defaultCommandTimeout: 10000,
    pageLoadTimeout: 60000,
    requestTimeout: 10000,
    responseTimeout: 30000,
    
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
