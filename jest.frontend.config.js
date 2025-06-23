export default {
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  globalTeardown: './tests/teardown.ts',
  testMatch: ['<rootDir>/tests/**/*.test.{ts,tsx}'],
  testTimeout: 12000,
  verbose: true,
  collectCoverage: false,
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  globalSetup: './tests/setup.ts',
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  moduleDirectories: ['node_modules', 'src']
};
