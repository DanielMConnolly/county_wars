
import "jest-puppeteer";
import "expect-puppeteer";
import '@testing-library/jest-dom';
import puppeteer, { Browser, ElementHandle, Page, } from 'puppeteer';
import {createNewGame, setupNewUser} from "./SetupUtils";
import { DataTestIDs } from '../src/DataTestIDs';
import { placeFranchise } from './TestUtils';

let testPage: Page;
let browser: Browser | undefined;

async function wait(seconds: number) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}


beforeAll(async () => {
    browser = await puppeteer.launch();
    testPage = await browser.newPage();
    await setupNewUser(testPage);
    await createNewGame(testPage, "my game");
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
        await wait(1);
        const restaurantCountStatItem2 =
            await testPage.$eval(`[data-testid="${DataTestIDs.FRANCHISE_COUNT}"]`, el => el.textContent);

        expect(restaurantCountStatItem2).toContain("2");

    });
});

afterAll(async () => {
    await browser?.close();
});

