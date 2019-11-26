'use strict';

const path = require('path');

module.exports = {
    verbose: true,
    rootDir: path.resolve('./test'),
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
