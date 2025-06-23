import puppeteer, { Browser, Page } from 'puppeteer';
import setupNewUser from './setupNewUser';
import { DataTestIDs } from '../src/DataTestIDs';

let testPage: Page;
let browser: Browser;


beforeAll(async () => {
  browser = await puppeteer.launch({ headless: false });
  testPage = await browser.newPage();
  await setupNewUser(testPage);
  testPage.goto('http://localhost:5173')
  await testPage.waitForSelector(`[data-testid="${DataTestIDs.CREATE_GAME_BUTTON}"]`);
  await testPage.click(`[data-testid="${DataTestIDs.CREATE_GAME_BUTTON}"]`);
  await testPage.type(`[data-testid="${DataTestIDs.GAME_NAME_INPUT}"]`, "County Conquest");
  await testPage.click(`[data-testid="${DataTestIDs.CREATE_GAME_SUBMIT_BUTTON}"]`);
});

describe("Create new game", () => {
  test("should load the County Wars application", async () => {
    await testPage.waitForSelector(`[data-testid="${DataTestIDs.CREATE_GAME_BUTTON}"]`);
    await testPage.click(`[data-testid="${DataTestIDs.CREATE_GAME_BUTTON}"]`);
    await testPage.type(`[data-testid="${DataTestIDs.GAME_NAME_INPUT}"]`, "County Conquest");
    await testPage.click(`[data-testid="${DataTestIDs.CREATE_GAME_SUBMIT_BUTTON}"]`);
  });
});

afterAll(async () => {
  await browser?.close();
});
