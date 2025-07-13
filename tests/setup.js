// Test setup file
process.env.NODE_ENV = 'test';
process.env.DB_PATH = ':memory:';
process.env.DB_LOGGING = 'false';

// Suppress console.log during tests
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: console.error // Keep error for debugging
};
