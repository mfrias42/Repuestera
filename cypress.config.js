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
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
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
