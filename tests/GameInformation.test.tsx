import "jest-puppeteer";
import "expect-puppeteer";
import '@testing-library/jest-dom';
import puppeteer, { Browser, Page } from "puppeteer";
import { DataTestIDs } from '../src/DataTestIDs';
import { createNewGame, setupNewUser } from "./SetupUtils";
import { placeFranchiseAt } from "./TestUtils";

let testPage: Page;
let browser: Browser;

beforeAll(async () => {
    browser = await puppeteer.launch({slowMo: 20});
    testPage = await browser.newPage();
    await setupNewUser(testPage);
    await createNewGame(testPage, "Game Information Test");
});

describe("Game Information Panel", () => {
    test("should show correct number of franchises after placing four franchises", async () => {
        // Wait for the map to load
        await testPage.waitForSelector('.leaflet-container');

        // Place four franchises at different locations
        const franchisePositions = [
            { x: 0, y: 0 },
            { x: 100, y: 100 },
            { x: -100, y: -100 },
            { x: 50, y: -50 }
        ];

        let successfulPlacements = 0;
        for (let i = 0; i < franchisePositions.length; i++) {
            const position = franchisePositions[i];
            const franchisePlaced = await placeFranchiseAt(testPage, position.x, position.y);
            if (franchisePlaced) {
                successfulPlacements++;
            }
        }

        // Ensure we placed at least 4 franchises
        expect(successfulPlacements).toBe(4);

        // Open the Game Information panel
        await testPage.waitForSelector(`[data-testid="${DataTestIDs.GAME_INFO_BUTTON}"]`);
        await testPage.click(`[data-testid="${DataTestIDs.GAME_INFO_BUTTON}"]`);

        // Wait for the modal to appear
        await testPage.waitForSelector(`[data-testid="${DataTestIDs.GAME_INFO_MODAL}"]`);

        // The modal opens with the Income tab active by default
        // Wait for the franchises count to be visible on the Income tab
        await testPage.waitForSelector(`[data-testid="${DataTestIDs.GAME_INFO_FRANCHISES_COUNT}"]`);

        // Get the franchise count from the income tab
        const franchiseCountText = await testPage.$eval(
            `[data-testid="${DataTestIDs.GAME_INFO_FRANCHISES_COUNT}"]`,
            el => el.textContent
        );

        // Assert that it shows 4 franchises
        expect(franchiseCountText).toBe('4');

        // Also test the franchises tab to ensure it shows the same count
        await testPage.click(`[data-testid="${DataTestIDs.GAME_INFO_FRANCHISES_TAB}"]`);

        // Wait for franchises tab content to load and check for "4 locations" text
        await testPage.waitForSelector('.bg-blue-100.text-blue-800',);
        const franchiseLocationsText = await testPage.$eval(
            '.bg-blue-100.text-blue-800',
            el => el.textContent
        );
        expect(franchiseLocationsText).toContain('4 locations');

        // Close the modal
        await testPage.click(`[data-testid="${DataTestIDs.GAME_INFO_CLOSE_BUTTON}"]`);

        // Verify modal is closed
        await testPage.waitForSelector(`[data-testid="${DataTestIDs.GAME_INFO_MODAL}"]`, { hidden: true });
    });
});

afterAll(async () => {
    await browser.close();
});
