// packages/backend/jest.config.js
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node', // Important for backend tests
  roots: ['<rootDir>/src', '<rootDir>/scripts'], // Where Jest should look for tests and source files
  testMatch: [ // Pattern for test files
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      // ts-jest configuration options
      tsconfig: 'tsconfig.json', // Or point to a specific tsconfig for tests if needed
    }],
  },
  moduleNameMapper: {
    // If you use path aliases in tsconfig that Jest needs to understand
    // Example: '^@common/(.*)$': '<rootDir>/../common/src/$1'
    // Adjust the path based on your monorepo structure
    // This helps Jest resolve imports like import { ... } from '@robot-sim/common';
    '^@robot-sim/common/(.*)$': '<rootDir>/../common/src/$1',
  },
  // Optional: Setup files to run before each test file (e.g., for global mocks)
  // setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // Optional: Collect coverage
  // collectCoverage: true,
  // coverageDirectory: "coverage",
  // coverageProvider: "v8", // or "babel"
};