import "jest-puppeteer";
import "expect-puppeteer";
import '@testing-library/jest-dom';
import puppeteer, { Page, Browser } from 'puppeteer';

let testPage: Page;
let browser: Browser;

// Import the setup function
const setup = require('./setup.js');

beforeAll(async () => {
  // Run our server setup first
  await setup();
  
  browser = await puppeteer.launch({
    headless: false,
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
});

afterAll(async () => {
  if (browser) {
    await browser.close();
  }
})
