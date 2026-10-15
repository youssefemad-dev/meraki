/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/lib'],
  testMatch: ['**/?(*.)+(spec|test).[tj]s?(x)'],
};

module.exports = config;