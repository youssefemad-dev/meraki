# Cypress End-to-End Testing Setup

## Installation

To install Cypress, run:

```bash
npm install --save-dev cypress
```

**Note**: The installation requires sufficient disk space. If you encounter "ENOSPC: no space left on device" errors, you will need to free up disk space before installing.

## Configuration

- `cypress.config.js` - Main Cypress configuration
- `cypress/support/e2e.js` - E2E support file for custom commands
- `cypress/e2e/` - Directory for end-to-end test files

## Running Tests

Once installed, you can run Cypress tests with:

```bash
# Open Cypress Test Runner
npx cypress open

# Run tests headless
npx cypress run
```

## Test Structure

See `cypress/e2e/movie-discovery.cy.js` for an example test covering the main user flow:
- Visiting the home page
- Entering a situation and getting recommendations
- Using example situation buttons from the sidebar