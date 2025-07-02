import "jest-puppeteer";
import "expect-puppeteer";
import '@testing-library/jest-dom';
import puppeteer, { Browser, Page } from "puppeteer";
import { DataTestIDs } from '../src/DataTestIDs';
import { createNewGame, setupNewUser } from "./SetupUtils";
import { placeFranchise } from "./TestUtils";
import { COLOR_OPTIONS } from "../src/constants/gameDefaults";


let testPage: Page;
let browser: Browser;

async function wait(seconds: number) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

beforeAll(async () => {
    browser = await puppeteer.launch({slowMo: 20});
    testPage = await browser.newPage();
    await setupNewUser(testPage);
    await createNewGame(testPage, "New Game");
});

describe("Settings", () => {
    test("Updating highlight color works", async () => {
        // change color
        await changeFranchiseColor(testPage, COLOR_OPTIONS[2].value);
        const svgElements = await testPage.$$('.leaflet-overlay-pane svg path');
        expect(svgElements.length).toBeGreaterThan(0);
        await placeFranchise(testPage, svgElements);
        let marker = await testPage.waitForSelector(`[data-testid="${DataTestIDs.FRANCHISE_MARKER}"]`);
        let markerStyle = await testPage.evaluate((el) => {
            return el.outerHTML;
        }, marker!);
        expect(markerStyle).toContain(COLOR_OPTIONS[2].value);

        // change color a second time
        await changeFranchiseColor(testPage, COLOR_OPTIONS[3].value);
        marker = await testPage.waitForSelector(`[data-testid="${DataTestIDs.FRANCHISE_MARKER}"]`);
        markerStyle = await testPage.evaluate((el) => {
            return el.outerHTML;
        }, marker!);
        expect(markerStyle).toContain(COLOR_OPTIONS[3].value);

        // reload page and ensure that the color is still the same
        await testPage.reload();
        await wait(2);
        marker = await testPage.waitForSelector(`[data-testid="${DataTestIDs.FRANCHISE_MARKER}"]`);
        markerStyle = await testPage.evaluate((el) => {
            return el.outerHTML;
        }, marker!);
        expect(markerStyle).toContain(COLOR_OPTIONS[3].value);
    });
});

const changeFranchiseColor = async (testPage: Page, color: string) => {
    await testPage.waitForSelector(`[data-testid="${DataTestIDs.SETTINGS_BUTTON}"]`);
    await testPage.click(`[data-testid="${DataTestIDs.SETTINGS_BUTTON}"]`);
    await testPage.waitForSelector(`[data-testid="${DataTestIDs.GAME_SETTINGS_BUTTON}"]`);
    await testPage.click(`[data-testid="${DataTestIDs.GAME_SETTINGS_BUTTON}"]`);
    await testPage.waitForSelector(`[data-testid="${DataTestIDs.SETTINGS_COLOR_SELECTOR}"]`);
    await testPage.click(`[data-testid="${DataTestIDs.SETTINGS_COLOR_SELECTOR}"]`);
    await testPage.select(`[data-testid="${DataTestIDs.SETTINGS_COLOR_SELECTOR}"] select`, color);

    // Wait for save button and ensure it's clickable
    await testPage.waitForSelector(`[data-testid="${DataTestIDs.GAME_SETTINGS_BUTTON_SAVE}"]`, { visible: true });

    // Scroll the save button into view
    await testPage.evaluate((testId) => {
        const button = document.querySelector(`[data-testid="${testId}"]`);
        if (button) {
            button.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, DataTestIDs.GAME_SETTINGS_BUTTON_SAVE);

    // Wait a bit for scrolling and any animations
    await wait(0.5);

    // Try clicking with JavaScript instead of Puppeteer's click
    await testPage.evaluate((testId) => {
        const button = document.querySelector(`[data-testid="${testId}"]`) as HTMLButtonElement;
        if (button) {
            button.click();
        } else {
            throw new Error('Save button not found for JS click');
        }
    }, DataTestIDs.GAME_SETTINGS_BUTTON_SAVE);
}


afterAll(async () => {
    await browser.close();
});
