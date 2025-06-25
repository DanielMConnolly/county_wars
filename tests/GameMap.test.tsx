
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
    browser = await puppeteer.launch({slowMo: 30});
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
             await testPage.$$eval(`[data-testid="${DataTestIDs.PLACE_FRANCHISE_BUTTON}"]`, el=> el[0].className);
        expect(placeFranchiseButtonClassNames).toContain("cursor-not-allowed");

        await wait(1);
        const franchiseCountAfterSecond =
            await testPage.$eval(`[data-testid="${DataTestIDs.FRANCHISE_COUNT}"]`, el => el.textContent);
        expect(franchiseCountAfterSecond).toBe(franchiseCountAfterFirst);
    });
});


afterAll(async () => {
    await browser?.close();
});
