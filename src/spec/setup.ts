// Jest setup file to configure test environment
process.env.NODE_ENV = 'test';

// Suppress console.log during tests for cleaner output
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

beforeAll(() => {
  // Only suppress logs if not explicitly running with verbose output
  if (!process.argv.includes('--verbose')) {
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
  }
});

afterAll(() => {
  // Restore original console methods
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
}); 