
import "jest-puppeteer";
import "expect-puppeteer";
import '@testing-library/jest-dom';
import puppeteer, { Browser, Page, } from 'puppeteer';
import setupNewUser from "./setupNewUser";

let testPage: Page;
let browser: Browser | undefined;

beforeAll(async () => {
    browser = await puppeteer.launch({ headless: false });
    testPage = await browser.newPage();
    testPage.setDefaultNavigationTimeout(12000);
    testPage.setDefaultTimeout(12000)
    await setupNewUser(testPage);
    await testPage.waitForSelector('[data-testid="create-game-button"]');
    await testPage.click('[data-testid="create-game-button"]');
    await testPage.type('[data-testid="game-name-input"]', "County Conquest");
    await testPage.click('[data-testid="create-game-submit-button"]');
});

describe("County Wars GameMap", () => {

    test("should have a map container", async () => {
        await testPage.waitForSelector('.leaflet-container');
        const mapContainer = await testPage.$('.leaflet-container');
        expect(mapContainer).toBeTruthy();
    });

    test("should load counties on the map", async () => {
        await testPage.waitForSelector('.leaflet-container');
        await testPage.waitForSelector('.leaflet-overlay-pane svg');
        await testPage.waitForSelector('.leaflet-overlay-pane svg path');
        const svgElements = await testPage.$$('.leaflet-overlay-pane svg path');
        expect(svgElements.length).toBeGreaterThan(0);
        await svgElements[100].click();
        await testPage.waitForSelector('[data-testid="info-card"]');
        const infoCardElement = await testPage.$$('[data-testid="info-card"]');
        expect(infoCardElement.length).toBeGreaterThan(0);
        await testPage.click('[data-testid="conquer-county-button"]');

    });
});

afterAll(async () => {
    await browser?.close();
});
