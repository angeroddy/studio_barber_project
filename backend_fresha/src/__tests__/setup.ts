/**
 * Test setup file
 * Runs before all tests to configure the test environment
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_EXPIRES_IN = '1h';

// Mock Sentry to avoid initialization errors in tests
jest.mock('../config/sentry', () => ({
  initSentry: jest.fn(),
  isSentryEnabled: jest.fn(() => false),
  captureError: jest.fn(),
  captureMessage: jest.fn(),
  default: {
    init: jest.fn(),
    captureException: jest.fn(),
    captureMessage: jest.fn(),
    setContext: jest.fn(),
    setupExpressErrorHandler: jest.fn(),
  },
}));

// Mock logger to avoid console noise during tests
jest.mock('../config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Increase timeout for database operations
jest.setTimeout(30000);
