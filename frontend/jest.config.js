const path = require('path');
const nextJest = require('next/jest');
const paths = require('./jest.paths');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleDirectories: ['node_modules', '<rootDir>'],
  roots: ['<rootDir>/src'],
  modulePaths: [paths['@']],
  moduleNameMapper: {
    '^@/(.*)$': path.join(paths['@'], '$1'),
  },
};

module.exports = createJestConfig(customJestConfig);