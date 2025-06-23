import { Page } from 'puppeteer';
import { setupTestPage } from "./setup";

let testPage: Page;

beforeAll(async () => {
  testPage = await setupTestPage();
  await testPage.goto("http://localhost:5173");

});

describe("Create new game", () => {
  test("should load the County Wars application", async () => {
    await testPage.waitForSelector('[data-testid="create-game-button"]');
    await testPage.click('[data-testid="create-game-button"]');
  });
});
