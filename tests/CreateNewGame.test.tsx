import puppeteer, { Browser, Page } from 'puppeteer';
import { createNewGame, setupNewUser } from './SetupUtils';
import { DataTestIDs } from '../src/DataTestIDs';

let testPage: Page;
let browser: Browser;

beforeAll(async () => {
  browser = await puppeteer.launch();
  testPage = await browser.newPage();
  await setupNewUser(testPage);
  await testPage.goto('http://localhost:5173')
});

describe("Create new game", () => {
  test("Verify that a game can be created and that it exists on the welcome screen after creation", async () => {
    await createNewGame(testPage, "County Conquest");

    await testPage.goto('http://localhost:5173')
    await testPage.waitForSelector(`[data-testid="${DataTestIDs.EXISTING_GAMES_LIST}"]`);
    let existingGamesText
      = await testPage.$eval(`[data-testid="${DataTestIDs.EXISTING_GAMES_LIST}"]`, el => el.textContent);
    expect(existingGamesText).toContain("County Conquest");
    // reload page and verify that the game is still there
    await testPage.reload();
    await testPage.waitForSelector(`[data-testid="${DataTestIDs.EXISTING_GAMES_LIST}"]`);
    existingGamesText
      = await testPage.$eval(`[data-testid="${DataTestIDs.EXISTING_GAMES_LIST}"]`, el => el.textContent);
    expect(existingGamesText).toContain("County Conquest");

  });
});

afterAll(async () => {
  await browser?.close();
});
