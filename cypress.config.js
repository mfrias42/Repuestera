const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_baseUrl || 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
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
