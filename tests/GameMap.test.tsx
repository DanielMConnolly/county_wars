
import "jest-puppeteer";
import "expect-puppeteer";
import '@testing-library/jest-dom';
import puppeteer, { Browser, Page, } from 'puppeteer';
import { createNewGame, setupNewUser } from "./SetupUtils";
import { DataTestIDs } from '../src/DataTestIDs';
import { wait, clickOnTerritory } from "./TestUtils";

let testPage: Page;
let browser: Browser | undefined;





beforeAll(async () => {
    browser = await puppeteer.launch({ slowMo: 30, headless: false });
    testPage = await browser.newPage();
    await setupNewUser(testPage);
    await createNewGame(testPage, "my game");
});

describe("Assert the Game Map is working as expected", () => {
    test("should have a map container", async () => {
        await testPage.waitForSelector('.leaflet-container');
        const mapContainer = await testPage.$('.leaflet-container');
        expect(mapContainer).toBeTruthy();
    });

    test("Click on place franchise", async () => {
        await testPage.waitForSelector('.leaflet-container');
        await testPage.waitForSelector('.leaflet-overlay-pane svg');
        const map = await testPage.waitForSelector('.leaflet-overlay-pane svg path');
        const boundingBox = await map!.boundingBox();
        await testPage.mouse.move(
            boundingBox!.x + boundingBox!.width / 2,
            boundingBox!.y + boundingBox!.height / 2,
        );
        const viewport = testPage.viewport();
        const viewportWidth = viewport!.width;
        const viewportHeight = viewport!.height;
        const centerX = viewportWidth / 2;
        const centerY = viewportHeight / 2;
        await testPage.mouse.click(centerX, centerY);
        await testPage.waitForSelector(`[data-testid="${DataTestIDs.PLACE_FRANCHISE_BUTTON}"]`);
        await testPage.click(`[data-testid="${DataTestIDs.PLACE_FRANCHISE_BUTTON}"]`);

        await testPage.mouse.click(centerX, centerY - 16);
        await testPage.waitForSelector(`[data-testid="${DataTestIDs.PLACE_FRANCHISE_BUTTON}"]`);
        await testPage.click(`[data-testid="${DataTestIDs.PLACE_FRANCHISE_BUTTON}"]`);
        await testPage.click(`[data-testid="${DataTestIDs.CLOSE_INFO_CARD_BUTTON}"]`);

        await wait(1);
        const restaurantCountStatItem2 =
            await testPage.$eval(`[data-testid="${DataTestIDs.FRANCHISE_COUNT}"]`, el => el.textContent);

        expect(restaurantCountStatItem2).toContain("2");
    });

    test("should not allow place a franchise in the same area twice", async () => {
        await testPage.mouse.wheel({ deltaY: -1600 });
        await wait(1);
        await clickOnTerritory(testPage);
        await testPage.waitForSelector(`[data-testid="${DataTestIDs.PLACE_FRANCHISE_BUTTON}"]`);
        await testPage.click(`[data-testid="${DataTestIDs.PLACE_FRANCHISE_BUTTON}"]`);
        await wait(1);
        await testPage.click(`[data-testid="${DataTestIDs.CLOSE_INFO_CARD_BUTTON}"]`);

        await wait(1);
        const franchiseCountAfterFirst =
            await testPage.$eval(`[data-testid="${DataTestIDs.FRANCHISE_COUNT}"]`, el => el.textContent);

        await clickOnTerritory(testPage, 0, -16);

        await testPage.waitForSelector(`[data-testid="${DataTestIDs.PLACE_FRANCHISE_BUTTON}"]`);
        await testPage.click(`[data-testid="${DataTestIDs.PLACE_FRANCHISE_BUTTON}"]`);


        // assert that the place franchise button is disabled
        const placeFranchiseButtonClassNames =
            await testPage.$$eval(`[data-testid="${DataTestIDs.PLACE_FRANCHISE_BUTTON}"]`, el => el[0].className);
        expect(placeFranchiseButtonClassNames).toContain("cursor-not-allowed");

        await wait(1);
        const franchiseCountAfterSecond =
            await testPage.$eval(`[data-testid="${DataTestIDs.FRANCHISE_COUNT}"]`, el => el.textContent);
        expect(franchiseCountAfterSecond).toBe(franchiseCountAfterFirst);
    });

    test("should show toast when clicking outside United States", async () => {
        // Wait for the map to be ready
        await testPage.waitForSelector('.leaflet-container');

        // Wait for county layer to load (this is important for the boundary check)
        await wait(5);

        // Zoom out to make it easier to click outside the US
        // await testPage.mouse.wheel({ deltaY: 3000 });
        // await wait(1);

        // Click in the far left of the map (should be in the Atlantic Ocean)
        await testPage.mouse.click(300, 300);

        // Wait a bit for processing
        await wait(2);

        // Try to find the toast with a longer timeout
        await testPage.waitForSelector(`[data-testid="${DataTestIDs.TOAST_NOTIFICATION}"]`, { timeout: 8000 });

        // Check that the toast message is correct
        const toastText = await testPage.$eval(
            `[data-testid="${DataTestIDs.TOAST_NOTIFICATION}"]`,
            el => el.textContent
        );

        expect(toastText).toContain('Location must be in the United States');


    }, 30000); // 30 second timeout for this test
});


afterAll(async () => {
    await browser?.close();
});
