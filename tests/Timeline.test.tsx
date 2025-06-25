import { beforeAll, afterAll, describe, test, expect } from '@jest/globals';
import puppeteer,{ Browser, Page }  from 'puppeteer';
import {setupNewUser, createNewGame} from './SetupUtils';
import { DataTestIDs } from '../src/DataTestIDs';

let browser: Browser;
let page: Page;

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));


beforeAll(async () => {
    browser = await puppeteer.launch({slowMo: 20});
    page = await browser.newPage();
    await setupNewUser(page);
    await createNewGame(page, "Test Game");
  });

describe('Timeline', () => {

  test('should render timeline component with correct year', async () => {
    // Wait for timeline component to be visible
    await page.waitForSelector(`[data-testid="${DataTestIDs.TIMELINE_TIME_DISPLAY}"]`);

    const yearText = await page.$eval(`[data-testid="${DataTestIDs.TIMELINE_TIME_DISPLAY}"]`, el => el.textContent);
    expect(yearText).toContain('1945');
  });

  test("Pausing the game should pause the timeline", async () => {
    await page.waitForSelector(`[data-testid="${DataTestIDs.TIMELINE_TIME_DISPLAY}"]`);
    const yearText = await page.$eval(`[data-testid="${DataTestIDs.TIMELINE_TIME_DISPLAY}"]`, el => el.textContent);
    await page.click(`[data-testid="${DataTestIDs.TIMELINE_PLAY_PAUSE_BUTTON}"]`);
    await wait(10000);
    const timelineTextAfterTenSecs =
        await page.$eval(`[data-testid="${DataTestIDs.TIMELINE_TIME_DISPLAY}"]`, el => el.textContent);
    expect(timelineTextAfterTenSecs).toEqual(yearText);
    await page.click(`[data-testid="${DataTestIDs.TIMELINE_PLAY_PAUSE_BUTTON}"]`);
    await wait(10000);
    const yearTextAfterTwentySecs =
        await page.$eval(`[data-testid="${DataTestIDs.TIMELINE_TIME_DISPLAY}"]`, el => el.textContent);
    expect(yearTextAfterTwentySecs).not.toEqual(yearText);
  }, 100000);

});


afterAll(async () => {
    await browser.close();
  });
