const { defineConfig } = require('cypress');

module.exports = defineConfig({
  projectId: '6zarjh', // Cypress Cloud Project ID
  e2e: {
    baseUrl: process.env.CYPRESS_baseUrl || 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    pageLoadTimeout: 30000,
    setupNodeEvents(on, config) {
      // implement node event listeners here
      return config;
    },
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.js',
    env: {
      apiUrl: process.env.CYPRESS_apiUrl || 'http://localhost:8000/api'
    },
    reporter: 'junit',
    reporterOptions: {
      mochaFile: 'cypress/results/results.xml',
      toConsole: true
    }
  },
});
