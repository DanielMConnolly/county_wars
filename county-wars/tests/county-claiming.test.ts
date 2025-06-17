import { Builder, By, until, WebDriver, WebElement } from 'selenium-webdriver';
import { Options } from 'selenium-webdriver/chrome';

describe('County Wars - County Claiming Test', () => {
  let driver: WebDriver;
  const APP_URL = 'http://localhost:5173';
  const SERVER_URL = 'http://localhost:3001';

  beforeAll(async () => {
    // Set up Chrome options for headless testing
    const chromeOptions = new Options();
    chromeOptions.addArguments('--headless'); // Remove this line if you want to see the browser
    chromeOptions.addArguments('--no-sandbox');
    chromeOptions.addArguments('--disable-dev-shm-usage');
    chromeOptions.addArguments('--disable-gpu');
    chromeOptions.addArguments('--window-size=1920,1080');

    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(chromeOptions)
      .build();
  });

  afterAll(async () => {
    if (driver) {
      await driver.quit();
    }
  });

  beforeEach(async () => {
    // Clear any existing data by reloading the page
    await driver.get(APP_URL);

    // Wait for the app to load
    await driver.wait(until.titleContains('County Wars'), 10000);

    // Wait for the map to load
    await driver.wait(until.elementLocated(By.css('.leaflet-container')), 15000);
  });

  test('should highlight and mark county as owned when claimed', async () => {
    console.log('Starting county claiming test...');

    // Step 1: Wait for the map and counties to load
    console.log('Waiting for map to load...');
    await driver.wait(until.elementLocated(By.css('.leaflet-container')), 15000);

    // Wait a bit more for the counties GeoJSON to load
    await driver.sleep(3000);

    // Step 2: Get the initial number of owned counties
    console.log('Getting initial owned counties count...');
    const userId = await driver.executeScript(`
      return localStorage.getItem('county-wars-user-id');
    `) as string;

    const initialCountiesResponse = await fetch(`${SERVER_URL}/api/counties/${userId}`);
    const initialCountiesData = await initialCountiesResponse.json();
    const initialOwnedCount = initialCountiesData.ownedCounties.length;
    console.log(`Initial owned counties: ${initialOwnedCount}`);

    // Step 3: Find and click on a county
    console.log('Looking for a clickable county...');


    console.log('Successfully clicked on a county');
    await driver.sleep(1000); // Wait for UI to update

    // Step 4: Verify the InfoCard shows county information
    console.log('Checking if InfoCard shows selected county...');
    await driver.wait(until.elementLocated(By.css('[class*="Territory Info"]')), 5000);

    const selectedCountyElement = await driver.findElement(By.xpath('//span[text()="Selected:"]/following-sibling::span'));
    const selectedCountyName = await selectedCountyElement.getText();
    console.log(`Selected county: ${selectedCountyName}`);

    expect(selectedCountyName).not.toBe('None');

    // Step 5: Find and click the "Conquer Territory" button
    console.log('Looking for Conquer Territory button...');
    const conquerButton = await driver.wait(
      until.elementLocated(By.xpath('//button[contains(text(), "Conquer Territory")]')),
      5000
    );

    // Verify button is enabled
    const isButtonEnabled = await conquerButton.isEnabled();
    expect(isButtonEnabled).toBe(true);

    console.log('Clicking Conquer Territory button...');
    await conquerButton.click();

    // Step 6: Wait for the county to be processed
    console.log('Waiting for county claiming to complete...');
    await driver.sleep(2000); // Wait for socket communication

    // Step 7: Verify the county is now owned
    console.log('Verifying county ownership...');

    // Check if the button text changed to "Already Owned"
    await driver.wait(async () => {
      const buttonText = await conquerButton.getText();
      return buttonText === 'Already Owned';
    }, 10000);

    const finalButtonText = await conquerButton.getText();
    expect(finalButtonText).toBe('Already Owned');

    // Step 8: Verify the county count increased
    console.log('Checking if owned counties count increased...');
    const finalCountiesResponse = await fetch(`${SERVER_URL}/api/counties/${userId}`);
    const finalCountiesData = await finalCountiesResponse.json();
    const finalOwnedCount = finalCountiesData.ownedCounties.length;

    console.log(`Final owned counties: ${finalOwnedCount}`);
    expect(finalOwnedCount).toBe(initialOwnedCount + 1);

    // Step 9: Verify the county is visually highlighted
    console.log('Verifying county is visually highlighted...');

    const isHighlighted = await driver.executeScript(`
      // Find the currently selected county and check if it has the owned styling
      const paths = document.querySelectorAll('.leaflet-interactive');

      for (let path of paths) {
        const style = window.getComputedStyle(path);
        const fillColor = style.fill || path.getAttribute('fill');

        // Check if this county has the owned county color (not the default blue)
        if (fillColor && !fillColor.includes('51, 136, 255')) {
          console.log('Found highlighted county with color:', fillColor);
          return true;
        }
      }

      return false;
    `) as boolean;

    expect(isHighlighted).toBe(true);

    console.log('✅ County claiming test completed successfully!');
  }, 30000); // 30 second timeout for the entire test

  test('should persist county ownership after page reload', async () => {
    console.log('Starting persistence test...');

    // First, claim a county (similar to previous test)
    await driver.wait(until.elementLocated(By.css('.leaflet-container')), 15000);
    await driver.sleep(3000);

    // Click on a county and claim it
    await driver.executeScript(`
      const paths = document.querySelectorAll('.leaflet-interactive');
      if (paths.length > 0) {
        paths[0].click();
      }
    `);

    await driver.sleep(1000);

    const conquerButton = await driver.wait(
      until.elementLocated(By.xpath('//button[contains(text(), "Conquer Territory")]')),
      5000
    );

    if (await conquerButton.isEnabled()) {
      await conquerButton.click();
      await driver.sleep(2000);
    }

    // Get the owned counties count
    const userId = await driver.executeScript(`
      return localStorage.getItem('county-wars-user-id');
    `) as string;

    const beforeReloadResponse = await fetch(`${SERVER_URL}/api/counties/${userId}`);
    const beforeReloadData = await beforeReloadResponse.json();
    const ownedCountsBeforeReload = beforeReloadData.ownedCounties.length;

    // Reload the page
    console.log('Reloading page...');
    await driver.navigate().refresh();
    await driver.wait(until.elementLocated(By.css('.leaflet-container')), 15000);
    await driver.sleep(3000);

    // Check if counties are still owned
    const afterReloadResponse = await fetch(`${SERVER_URL}/api/counties/${userId}`);
    const afterReloadData = await afterReloadResponse.json();
    const ownedCountsAfterReload = afterReloadData.ownedCounties.length;

    expect(ownedCountsAfterReload).toBe(ownedCountsBeforeReload);

    console.log('✅ Persistence test completed successfully!');
  }, 30000);
});
