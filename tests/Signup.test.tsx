import "jest-puppeteer";
import "expect-puppeteer";
import '@testing-library/jest-dom';
import { Page, Browser } from "puppeteer";
import puppeteer from 'puppeteer-extra';
import { setup } from "./setup.js";
// @ts-ignore
import puppeteerBlockResources from 'puppeteer-extra-plugin-user-preferences';

let testPage: Page;
let browser: Browser;



beforeAll(async () => {
  // Run our server setup first
  await setup();

  puppeteer.use(puppeteerBlockResources(({
    userPrefs: {
      safebrowsing: {
        enabled: false,
        enhanced: false
      }
    }
  })));


  browser = await puppeteer.launch({
  });
  testPage = await browser.newPage();

  testPage.setDefaultNavigationTimeout(60000);
  testPage.setDefaultTimeout(60000000);
  await testPage.goto("http://localhost:5173/signup");
}, 1000000);

describe("Signup flow", () => {
  test("should complete signup and navigate to welcome screen", async () => {
    // Wait for signup form to load
    await testPage.waitForSelector('[data-testid="signup-username-input"]', { timeout: 10000 });

    // Fill out the signup form
    await testPage.type('[data-testid="signup-username-input"]', 'testuser123');
    await testPage.type('[data-testid="signup-email-input"]', 'testuser123@example.com');
    await testPage.type('[data-testid="signup-password-input"]', 'password123');
    await testPage.type('[data-testid="signup-confirm-password-input"]', 'password123');

    // Submit the form
    await testPage.click('[data-testid="signup-submit-button"]');

    // Wait for navigation to welcome screen and verify we're there
    const welcomeScreen =
      await testPage.waitForSelector('[data-testid="welcome-screen"]', { timeout: 10000 });
    expect(welcomeScreen).toBeTruthy();
  }, 1000000);

  test("should show error message when passwords don't match", async () => {
    // Navigate to signup page (reload to reset state)
    await testPage.goto("http://localhost:5173/signup");

    // Wait for signup form to load
    await testPage.waitForSelector('[data-testid="signup-username-input"]', { timeout: 10000 });

    // Fill out the form with mismatched passwords
    await testPage.type('[data-testid="signup-username-input"]', 'testuser456');
    await testPage.type('[data-testid="signup-email-input"]', 'testuser456@example.com');
    await testPage.type('[data-testid="signup-password-input"]', 'password123');
    await testPage.type('[data-testid="signup-confirm-password-input"]', 'differentpassword');

    // Wait for the error message to appear
    await testPage.waitForFunction(() => {
      const element = document.querySelector('[data-testid="passwords-do-not-match-text"]');
      return element && element.textContent === 'Passwords do not match';
    });

    // Verify the error message is visible
    const errorMessage = await testPage.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('p'));
      const errorElement = elements.find(el => el.textContent === 'Passwords do not match');
      return errorElement ? errorElement.textContent : null;
    });
    expect(errorMessage).toBe('Passwords do not match');
  });
})

afterAll(async () => {
  if (browser) {
    await browser.close();
  }
});
