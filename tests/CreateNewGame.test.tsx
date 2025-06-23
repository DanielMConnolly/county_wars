import puppeteer, { Browser, Page } from 'puppeteer';
import setupNewUser from './setupNewUser';

let testPage: Page;
let browser: Browser;


beforeAll(async () => {
  browser = await puppeteer.launch({ headless: false });
  testPage = await browser.newPage();
  await setupNewUser(testPage);
  testPage.goto('http://localhost:5173')
  await testPage.waitForSelector('[data-testid="create-game-button"]');
  await testPage.click('[data-testid="create-game-button"]');
  await testPage.type('[data-testid="game-name-input"]', "County Conquest");
  await testPage.click('[data-testid="create-game-submit-button"]');
});

describe("Create new game", () => {
  test("should load the County Wars application", async () => {
    await testPage.waitForSelector('[data-testid="create-game-button"]');
    await testPage.click('[data-testid="create-game-button"]');
  });
});

afterAll(async () => {
  await browser?.close();
});
