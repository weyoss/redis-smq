'use strict';

const path = require('path');

module.exports = {
    verbose: true,
    rootDir: path.resolve('./'),
    setupFilesAfterEnv: ['<rootDir>/test/jest.setup.js'],
    coverageDirectory: '<rootDir>/docs/coverage',
    collectCoverage: true
};
