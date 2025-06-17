# County Wars E2E Tests

This directory contains Selenium-based end-to-end tests for the County Wars application.

## Prerequisites

1. **Chrome Browser**: Tests run on Chrome (headless by default)
2. **Node.js Dependencies**: Run `npm install` to install test dependencies
3. **Application Services**: Backend server and frontend dev server must be running

## Test Files

- `county-claiming.test.ts` - Main test suite for county claiming functionality
- `setup.ts` - Global test configuration and setup
- `run-e2e-tests.sh` - Script that starts services and runs tests
- `README.md` - This documentation

## Running Tests

### Option 1: Full Automated Testing (Recommended)
```bash
npm run test:e2e:full
```
This script will:
- Kill any existing processes on ports 3001, 5173, 5174
- Start the backend server (port 3001)
- Start the frontend dev server (port 5174)
- Wait for both services to be ready
- Run the E2E tests
- Clean up all processes when done

### Option 2: Manual Testing
If you already have the services running:
```bash
npm run test:e2e
```

### Option 3: Run with Visible Browser
To see the browser during testing, edit `county-claiming.test.ts` and comment out this line:
```typescript
chromeOptions.addArguments('--headless'); // Remove this line if you want to see the browser
```

## Test Coverage

### Test 1: County Claiming Functionality
**What it tests:**
- Map loads correctly with counties
- User can click on a county to select it
- InfoCard shows selected county information
- "Conquer Territory" button is enabled for unowned counties
- Clicking "Conquer Territory" claims the county
- County count increases in database
- County is visually highlighted on the map
- Button text changes to "Already Owned"

**Steps:**
1. Load the application
2. Wait for map and counties to load
3. Click on an available county
4. Verify InfoCard shows county details
5. Click "Conquer Territory" button
6. Verify county is claimed (button text, database, highlighting)

### Test 2: County Ownership Persistence
**What it tests:**
- Claimed counties persist after page reload
- Database maintains ownership data
- UI correctly loads owned counties on refresh

**Steps:**
1. Claim a county
2. Record owned county count
3. Reload the page
4. Verify owned county count is the same

## Test Configuration

### Timeouts
- Individual test timeout: 30 seconds
- Service startup timeout: 60 seconds (30 attempts × 2 seconds)
- Element wait timeout: 5-15 seconds depending on operation

### Browser Configuration
- **Headless**: Enabled by default for CI/CD
- **Window Size**: 1920x1080
- **Chrome Options**: No sandbox, disabled GPU for stability

## Debugging Tests

### Common Issues

1. **Services not starting**
   - Check if ports 3001, 5173, 5174 are already in use
   - Run the cleanup script: `./tests/run-e2e-tests.sh` (it cleans up first)

2. **Counties not loading**
   - Increase wait times in the test
   - Check if `counties.geojson` file exists in `public/` directory
   - Verify network requests in browser dev tools

3. **ChromeDriver issues**
   - Update Chrome browser to latest version
   - Ensure ChromeDriver is compatible with your Chrome version

4. **Test timeouts**
   - Increase timeout values in `jest.config.js`
   - Check if your machine is running slowly

### Debugging Tips

1. **Enable visible browser**: Comment out the headless option to see what's happening
2. **Add console logs**: The test already includes extensive logging
3. **Check server logs**: Look at the terminal running the backend server
4. **Database inspection**: Check `county-wars.db` file for data persistence

## CI/CD Integration

The tests are designed to run in CI/CD environments:
- Headless by default
- Automatic service management
- Comprehensive cleanup
- Detailed logging for debugging

To integrate with GitHub Actions or other CI systems, use:
```bash
npm run test:e2e:full
```

## Test Architecture

- **Framework**: Jest + Selenium WebDriver
- **Browser**: Chrome (headless)
- **Test Pattern**: Integration tests that verify full user workflows
- **Data Verification**: Tests both UI state and database state
- **Service Management**: Automated startup and cleanup of required services

## Future Test Ideas

1. **Multi-user scenarios**: Test county conflicts between users
2. **Performance tests**: Measure map loading and county claiming speed
3. **Mobile responsiveness**: Test on different screen sizes
4. **Error scenarios**: Test network failures, server downtime
5. **Accessibility**: Test keyboard navigation and screen readers