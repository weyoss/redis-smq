'use strict';

const path = require('path');

module.exports = {
  verbose: true,
  rootDir: path.resolve('./'),
  testMatch: ['**/dist/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/dist/tests/jest.setup.js'],
  coverageDirectory: '<rootDir>/docs/coverage',
  collectCoverage: true,
};
