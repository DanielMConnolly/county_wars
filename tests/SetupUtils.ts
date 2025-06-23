import { Page } from "puppeteer";
import { DataTestIDs } from '../src/DataTestIDs';


export async function setupNewUser(testPage: Page){
    const randomUserName = generateRandomString(10);
    await testPage.goto('http://localhost:5173/signup');
    await testPage.waitForSelector(`[data-testid="${DataTestIDs.SIGNUP_USERNAME_INPUT}"]`);

    // Fill out the signup form
    await testPage.type(`[data-testid="${DataTestIDs.SIGNUP_USERNAME_INPUT}"]`, randomUserName);
    await testPage.type(`[data-testid="${DataTestIDs.SIGNUP_EMAIL_INPUT}"]`, `${randomUserName}@example.com`);
    await testPage.type(`[data-testid="${DataTestIDs.SIGNUP_PASSWORD_INPUT}"]`, 'sdffsdsdfpassword123');
    await testPage.type(`[data-testid="${DataTestIDs.SIGNUP_CONFIRM_PASSWORD_INPUT}"]`, 'sdffsdsdfpassword123');

    await testPage.click(`[data-testid="${DataTestIDs.SIGNUP_SUBMIT_BUTTON}"]`);

    await testPage.waitForSelector(`[data-testid="${DataTestIDs.LOGGED_IN_USER_MENU}"]`);
}

export async function createNewGame(testPage: Page, nameOfGame: string){
  testPage.goto('http://localhost:5173')
    await testPage.waitForSelector(`[data-testid="${DataTestIDs.CREATE_GAME_BUTTON}"]`);
    await testPage.click(`[data-testid="${DataTestIDs.CREATE_GAME_BUTTON}"]`);
    await testPage.type(`[data-testid="${DataTestIDs.GAME_NAME_INPUT}"]`, nameOfGame);
    await testPage.click(`[data-testid="${DataTestIDs.CREATE_GAME_SUBMIT_BUTTON}"]`);
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
