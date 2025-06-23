import { Page } from "puppeteer";
import { DataTestIDs } from '../src/DataTestIDs';


export default async function setupNewUser(testPage: Page){
    const randomUserName = generateRandomString(10);
    await testPage.goto('http://localhost:5173/signup');
    await testPage.waitForSelector(`[data-testid="${DataTestIDs.SIGNUP_USERNAME_INPUT}"]`);

    // Fill out the signup form
    await testPage.type(`[data-testid="${DataTestIDs.SIGNUP_USERNAME_INPUT}"]`, randomUserName);
    await testPage.type(`[data-testid="${DataTestIDs.SIGNUP_EMAIL_INPUT}"]`, `${randomUserName}@example.com`);
    await testPage.type(`[data-testid="${DataTestIDs.SIGNUP_PASSWORD_INPUT}"]`, 'sdffsdsdfpassword123');
    await testPage.type(`[data-testid="${DataTestIDs.SIGNUP_CONFIRM_PASSWORD_INPUT}"]`, 'sdffsdsdfpassword123');

    await testPage.click(`[data-testid="${DataTestIDs.SIGNUP_SUBMIT_BUTTON}"]`);

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
