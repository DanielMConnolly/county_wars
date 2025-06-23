import "jest-puppeteer";
import "expect-puppeteer";
import '@testing-library/jest-dom';
import puppeteer, { Browser, Page} from "puppeteer";


let testPage: Page;
let browser: Browser;


beforeAll(async () => {
  browser = await puppeteer.launch({ headless: false });
  testPage = await browser.newPage();

  await testPage.goto("http://localhost:5173/signup");
});

describe("Signup flow", () => {
  test("should complete signup and navigate to welcome screen", async () => {
    // Wait for signup form to load
    await testPage.waitForSelector('[data-testid="signup-username-input"]');

    // Fill out the signup form
    await testPage.type('[data-testid="signup-username-input"]', 'testuser123');
    await testPage.type('[data-testid="signup-email-input"]', 'testuser123@example.com');
    await testPage.type('[data-testid="signup-password-input"]', 'dsffsdfsdpassword123');
    await testPage.type('[data-testid="signup-confirm-password-input"]', 'dsffsdfsdpassword123');

    // Submit the form
    await testPage.click('[data-testid="signup-submit-button"]');

    // Wait for navigation to welcome screen and verify we're there
    const welcomeScreen =
      await testPage.waitForSelector('[data-testid="welcome-screen"]');
    expect(welcomeScreen).toBeTruthy();
  }, 1000000);

  test("should show error message when passwords don't match", async () => {
    // Navigate to signup page (reload to reset state)
    await testPage.goto("http://localhost:5173/signup");

    // Wait for signup form to load
    await testPage.waitForSelector('[data-testid="signup-username-input"]');

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
  await browser.close();
});
