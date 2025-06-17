// Global test setup
import 'whatwg-fetch';

// Set up timeouts
jest.setTimeout(30000);

// Global test configuration
beforeAll(() => {
  console.log('Starting County Wars E2E Tests...');
});

afterAll(() => {
  console.log('County Wars E2E Tests completed.');
});