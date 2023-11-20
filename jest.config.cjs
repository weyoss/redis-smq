/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
const { resolve } = require('path');

module.exports = {
  rootDir: resolve('./'),
  testMatch: ['**/dist/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/dist/tests/jest.setup.js'],
  coverageDirectory: '<rootDir>/coverage',
};
