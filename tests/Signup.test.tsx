import "jest-puppeteer";
import "expect-puppeteer";
import '@testing-library/jest-dom';
import puppeteer, { Browser, Page } from "puppeteer";
import { DataTestIDs } from '../src/DataTestIDs';


let testPage: Page;
let browser: Browser;


beforeAll(async () => {
  browser = await puppeteer.launch({headless: false});
  testPage = await browser.newPage();

  await testPage.goto("http://localhost:5173/signup");
});

describe("Signup flow", () => {
  test("should complete signup and navigate to welcome screen", async () => {
    // Wait for signup form to load
    await testPage.waitForSelector(`[data-testid="${DataTestIDs.SIGNUP_USERNAME_INPUT}"]`);

    // Fill out the signup form
    await testPage.type(`[data-testid="${DataTestIDs.SIGNUP_USERNAME_INPUT}"]`, 'testuser123');
    await testPage.type(`[data-testid="${DataTestIDs.SIGNUP_EMAIL_INPUT}"]`, 'testuser123@example.com');
    await testPage.type(`[data-testid="${DataTestIDs.SIGNUP_PASSWORD_INPUT}"]`, 'dsffsdfsdpassword123');
    await testPage.type(`[data-testid="${DataTestIDs.SIGNUP_CONFIRM_PASSWORD_INPUT}"]`, 'dsffsdfsdpassword123');

    // Submit the form
    await testPage.click(`[data-testid="${DataTestIDs.SIGNUP_SUBMIT_BUTTON}"]`);

    // Wait for navigation to welcome screen and verify we're there
    const welcomeScreen =
      await testPage.waitForSelector(`[data-testid="${DataTestIDs.WELCOME_SCREEN}"]`);
    expect(welcomeScreen).toBeTruthy();
  });

  test("should show error message when passwords don't match", async () => {
    // Navigate to signup page (reload to reset state)
    await testPage.goto("http://localhost:5173/signup");

    // Wait for signup form to load
    await testPage.waitForSelector(`[data-testid="${DataTestIDs.SIGNUP_USERNAME_INPUT}"]`);

    // Fill out the form with mismatched passwords
    await testPage.type(`[data-testid="${DataTestIDs.SIGNUP_USERNAME_INPUT}"]`, 'testuser456');
    await testPage.type(`[data-testid="${DataTestIDs.SIGNUP_EMAIL_INPUT}"]`, 'testuser456@example.com');
    await testPage.type(`[data-testid="${DataTestIDs.SIGNUP_PASSWORD_INPUT}"]`, 'password123');
    await testPage.type(`[data-testid="${DataTestIDs.SIGNUP_CONFIRM_PASSWORD_INPUT}"]`, 'differentpassword');

    // Verify the error message is visible
    const passwordErrorText =
      await
      testPage.$eval(`[data-testid="${DataTestIDs.PASSWORDS_DO_NOT_MATCH_TEXT}"]`, el => el.textContent);
    expect(passwordErrorText).toContain('Passwords do not match');

  });
})

afterAll(async () => {
  await browser.close();
});
