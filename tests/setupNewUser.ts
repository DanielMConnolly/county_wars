import { Page } from "puppeteer";


export default async function setupNewUser(testPage: Page){
    await testPage.goto('http://localhost:5173/signup');
    await testPage.waitForSelector('[data-testid="signup-username-input"]');

    // Fill out the signup form
    await testPage.type('[data-testid="signup-username-input"]', 'testuser123');
    await testPage.type('[data-testid="signup-email-input"]', 'testuser123@example.com');
    await testPage.type('[data-testid="signup-password-input"]', 'sdffsdsdfpassword123');
    await testPage.type('[data-testid="signup-confirm-password-input"]', 'sdffsdsdfpassword123');

    await testPage.click('[data-testid="signup-submit-button"]');

}
