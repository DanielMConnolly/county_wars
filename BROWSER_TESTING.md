# Browser Testing for GameMap Component

This guide shows you how to run GameMap.test.tsx in a real browser environment to test the actual county selection functionality with real Leaflet rendering.

## Quick Start

### Option 1: Interactive Test Server (Recommended)
```bash
npm run test:server
```

This will:
- Start a test server at http://localhost:3001
- Open your browser automatically
- Provide links to both the test runner and main app

### Option 2: Automated Browser Tests
```bash
npm run test:browser
```

This runs automated tests using Puppeteer in a real Chrome browser and provides detailed test results.

## What Gets Tested

### In Browser Environment
- ✅ Real Leaflet map initialization
- ✅ Actual county geojson loading and rendering
- ✅ Interactive county selection (clicking on counties)
- ✅ County highlighting and style changes
- ✅ Integration with React components
- ✅ Full application context (GameStateProvider, etc.)

### Vs Jest Environment
- Jest: Mocked Leaflet, simulated interactions
- Browser: Real Leaflet, real DOM events, visual verification

## Test Features

### Interactive Test Runner (`/test`)
- Live GameMap component rendering
- Real-time test execution
- Visual verification of map behavior
- Click-to-test county selection
- Detailed test results display

### Automated E2E Tests
- Headless or visible browser testing
- Screenshot capture for visual verification
- Console log monitoring
- Comprehensive DOM structure verification
- County path detection and interaction testing

## Files Created

1. **`tests/browser-test-runner.html`** - Interactive browser test page
2. **`test-dev-server.js`** - Development test server
3. **`tests/browser-e2e.test.js`** - Automated browser tests
4. **Updated `package.json`** - New npm scripts

## Running Specific Tests

### Test Map Container
```javascript
// In browser console or test runner
const mapContainer = document.querySelector('[data-testid="game-map"]');
console.log('Map exists:', !!mapContainer);
console.log('Has Leaflet classes:', mapContainer.classList.contains('leaflet-container'));
```

### Test County Selection
```javascript
// Wait for counties to load, then click
setTimeout(() => {
    const counties = document.querySelectorAll('.leaflet-overlay-pane svg path');
    console.log('Counties found:', counties.length);
    if (counties[0]) counties[0].click();
}, 3000);
```

### Test Game State Integration
```javascript
// Check if InfoCard appears after county selection
const infoCard = document.querySelector('[data-testid="conquer-territory-button"]');
console.log('InfoCard visible:', !!infoCard);
```

## Debugging Tips

1. **Open Browser DevTools** when using `npm run test:server`
2. **Check Console Logs** for Leaflet initialization messages
3. **Inspect DOM** to see actual SVG path elements created by geojson
4. **Network Tab** to verify counties.geojson loading
5. **Screenshots** are saved by automated tests for visual verification

## Integration with Main App

The browser tests use the same components as your main application:
- Same GameStateProvider
- Same GameMap component  
- Same county selection logic
- Same Leaflet configuration

This ensures your tests reflect real production behavior.

## Why Browser Testing?

Jest tests are great for unit testing, but county selection involves:
- Real DOM SVG path creation by Leaflet
- Mouse event handling on dynamic elements
- Visual feedback (highlighting, style changes)
- Complex geojson rendering pipeline

Browser testing verifies these work correctly in the actual runtime environment your users will experience.