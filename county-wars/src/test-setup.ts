import '@testing-library/jest-dom';

// Mock Leaflet since it requires a browser environment
(global as any).L = {
  map: jest.fn(() => ({
    setView: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    remove: jest.fn(),
    addLayer: jest.fn(),
    removeLayer: jest.fn()
  })),
  tileLayer: jest.fn(() => ({
    addTo: jest.fn(),
    wms: jest.fn()
  })),
  geoJSON: jest.fn(() => ({
    addTo: jest.fn(),
    setStyle: jest.fn(),
    on: jest.fn(),
    addData: jest.fn(),
    resetStyle: jest.fn()
  }))
};

// Mock fetch for GeoJSON data
global.fetch = jest.fn();

// Set up console error filtering for known issues
const originalError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('ResizeObserver')) {
    return;
  }
  originalError.call(console, ...args);
};