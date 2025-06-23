import { Page } from "puppeteer";


export default async function setupNewUser(testPage: Page){
    const randomUserName = generateRandomString(10);
    await testPage.goto('http://localhost:5173/signup');
    await testPage.waitForSelector('[data-testid="signup-username-input"]');

    // Fill out the signup form
    await testPage.type('[data-testid="signup-username-input"]', randomUserName);
    await testPage.type('[data-testid="signup-email-input"]', `${randomUserName}@example.com`);
    await testPage.type('[data-testid="signup-password-input"]', 'sdffsdsdfpassword123');
    await testPage.type('[data-testid="signup-confirm-password-input"]', 'sdffsdsdfpassword123');

    await testPage.click('[data-testid="signup-submit-button"]');

}

function generateRandomString(length: number): string {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }
