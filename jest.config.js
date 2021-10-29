'use strict';

const path = require('path');

module.exports = {
  rootDir: path.resolve('./'),
  testMatch: ['**/dist/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/dist/tests/jest.setup.js'],
  coverageDirectory: '<rootDir>/coverage',
};
