// Jest setup file for global test configuration

// Set up environment variables for testing
process.env.NODE_ENV = 'test';
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-api-key';

// Global test timeout
jest.setTimeout(30000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to silence console output during tests
  // log: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
  // info: jest.fn(),
  // debug: jest.fn(),
};
