import puppeteer, { Browser, Page } from 'puppeteer';
import setupNewUser from './setupNewUser';
import { DataTestIDs } from '../src/DataTestIDs';

let testPage: Page;
let browser: Browser;


beforeAll(async () => {
  browser = await puppeteer.launch();
  testPage = await browser.newPage();
  await setupNewUser(testPage);
  testPage.goto('http://localhost:5173')
}, 1000000);

describe("Create new game", () => {
  test("Verify that a game can be created and that it exists on the welcome screen after creation", async () => {
    await testPage.waitForSelector(`[data-testid="${DataTestIDs.CREATE_GAME_BUTTON}"]`);
    await testPage.click(`[data-testid="${DataTestIDs.CREATE_GAME_BUTTON}"]`);
    await testPage.type(`[data-testid="${DataTestIDs.GAME_NAME_INPUT}"]`, "County Conquest");
    await testPage.click(`[data-testid="${DataTestIDs.CREATE_GAME_SUBMIT_BUTTON}"]`);

    testPage.goto('http://localhost:5173')
    await testPage.waitForSelector(`[data-testid="${DataTestIDs.EXISTING_GAMES_LIST}"]`);
    let existingGamesText
     = await testPage.$eval(`[data-testid="${DataTestIDs.EXISTING_GAMES_LIST}"]`, el => el.textContent);
    expect(existingGamesText).toContain("County Conquest");
    // reload page and verify that the game is still there
    testPage.reload();
    await testPage.waitForSelector(`[data-testid="${DataTestIDs.EXISTING_GAMES_LIST}"]`);
    existingGamesText
    = await testPage.$eval(`[data-testid="${DataTestIDs.EXISTING_GAMES_LIST}"]`, el => el.textContent);
   expect(existingGamesText).toContain("County Conquest");

  });
});

afterAll(async () => {
  await browser?.close();
});
