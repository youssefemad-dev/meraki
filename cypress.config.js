// Cypress loads this configuration as CommonJS.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { defineConfig } = require('cypress');

module.exports = defineConfig({
  video: false,
  e2e: {
    setupNodeEvents() {
      // Register Node event handlers here when the E2E suite needs them.
    },
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.js',
  },
});
