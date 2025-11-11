const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    env: {
      apiUrl: 'http://localhost:8000/api'
    },
    defaultCommandTimeout: 20000,  // Aumentado de 10s a 20s para Azure
    requestTimeout: 15000,
    responseTimeout: 15000,
    pageLoadTimeout: 60000,  // Aumentado para páginas lentas en Azure
    reporter: 'cypress-multi-reporters',
    reporterOptions: {
      reporterEnabled: 'spec, mocha-junit-reporter',
      mochaJunitReporterReporterOptions: {
        mochaFile: 'cypress/results/junit-[hash].xml',
        toConsole: false
      }
    }
  },
});
