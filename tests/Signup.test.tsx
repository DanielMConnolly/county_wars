import "jest-puppeteer";
import "expect-puppeteer";
import '@testing-library/jest-dom';
import puppeteer, { Page, Browser } from 'puppeteer';
import { setup } from "./setup.js";

let testPage: Page;
let browser: Browser;

// // Import the setup function
// const setup =

beforeAll(async () => {
  // Run our server setup first
  await setup();

  browser = await puppeteer.launch({
    headless: false, // Set to false to see the browser
  });
  testPage = await browser.newPage();
  await testPage.goto("http://localhost:5173/signup");
});

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
  });

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
    }, { timeout: 5000 });

    // Verify the error message is visible
    const errorMessage = await testPage.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('p'));
      const errorElement = elements.find(el => el.textContent === 'Passwords do not match');
      return errorElement ? errorElement.textContent : null;
    });
    expect(errorMessage).toBe('Passwords do not match');
  });
});

afterAll(async () => {
  if (browser) {
    await browser.close();
  }
})
