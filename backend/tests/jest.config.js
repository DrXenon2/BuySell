/**
 * Configuration Jest pour les tests
 */

module.exports = {
  // Environnement de test
  testEnvironment: 'node',
  
  // Racine du projet
  rootDir: '../',
  
  // Dossiers à inclure dans les tests
  roots: [
    '<rootDir>/tests',
    '<rootDir>/src'
  ],
  
  // Fichiers de setup
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.js'
  ],
  
  // Fichiers de teardown
  globalTeardown: '<rootDir>/tests/teardown.js',
  
  // Coverage reporting
  collectCoverage: true,
  coverageDirectory: '<rootDir>/tests/coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/docs/**',
    '!src/config/index.js',
    '!src/server.js'
  ],
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Patterns de fichiers de test
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],
  
  // Ignorer certains dossiers
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/'
  ],
  
  // Transformations
  transform: {},
  
  // Variables d'environnement pour les tests
  testEnvironmentOptions: {
    NODE_ENV: 'test',
  },
  
  // Verbosité
  verbose: true,
  silent: false
};
