
import "jest-puppeteer";
import "expect-puppeteer";
import '@testing-library/jest-dom';
import puppeteer, { Browser, ElementHandle, Page, } from 'puppeteer';
import setupNewUser from "./setupNewUser";
import { DataTestIDs } from '../src/DataTestIDs';

let testPage: Page;
let browser: Browser | undefined;

beforeAll(async () => {
    browser = await puppeteer.launch({ headless: false });
    testPage = await browser.newPage();
    testPage.setDefaultNavigationTimeout(12000);
    testPage.setDefaultTimeout(12000)
    await setupNewUser(testPage);
    await testPage.waitForSelector(`[data-testid="${DataTestIDs.CREATE_GAME_BUTTON}"]`);
    await testPage.click(`[data-testid="${DataTestIDs.CREATE_GAME_BUTTON}"]`);
    await testPage.type(`[data-testid="${DataTestIDs.GAME_NAME_INPUT}"]`, "County Conquest");
    await testPage.click(`[data-testid="${DataTestIDs.CREATE_GAME_SUBMIT_BUTTON}"]`);
});

describe("County Wars GameMap", () => {

    test("should have a map container", async () => {
        await testPage.waitForSelector('.leaflet-container');
        const mapContainer = await testPage.$('.leaflet-container');
        expect(mapContainer).toBeTruthy();
    });

    test("Click on place franchise", async () => {
        await testPage.waitForSelector('.leaflet-container');
        await testPage.waitForSelector('.leaflet-overlay-pane svg');
        await testPage.waitForSelector('.leaflet-overlay-pane svg path');
        const svgElements = await testPage.$$('.leaflet-overlay-pane svg path');
        expect(svgElements.length).toBeGreaterThan(0);

        await placeFranchise(testPage, svgElements);
        await placeFranchise(testPage, svgElements);
        const restaurantCountStatItem2 =
            await testPage.$eval(`[data-testid="${DataTestIDs.FRANCHISE_COUNT}"]`, el => el.textContent);
        expect(restaurantCountStatItem2).toContain("2");

    });
});

afterAll(async () => {
    await browser?.close();
});

const placeFranchise = async (testPage: Page, svgElements: Array<ElementHandle<any>>) => {
    const countyNumber = Math.floor(Math.random() * 3001)
    console.log("countyNumber: " + countyNumber);
    await svgElements[countyNumber].click();

    await testPage.waitForSelector(`[data-testid="${DataTestIDs.INFO_CARD}"]`);
    await testPage.click(`[data-testid="${DataTestIDs.PLACE_FRANCHISE_BUTTON}"]`);
}
