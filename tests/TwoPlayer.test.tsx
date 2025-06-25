import "jest-puppeteer";
import "expect-puppeteer";
import '@testing-library/jest-dom';
import puppeteer, { Browser, Page } from 'puppeteer';
import { createNewGame, setupNewUser } from "./SetupUtils";
import {getFranchiseCount, placeFranchiseAt, wait, waitForFranchiseUpdate, clickOnTerritory, checkInfoCardAppears } from './TestUtils';

let playerAPage: Page;
let playerBPage: Page;
let browserA: Browser;
let browserB: Browser;
let gameId: string;

async function joinSameGame(playerAPage: Page, playerBPage: Page, gameName: string) {
    // Player A creates the game
    await createNewGame(playerAPage, gameName);

    // Extract game ID from URL
    const url = playerAPage.url();
    const match = url.match(/\/game\/(.+)/);
    gameId = match ? match[1] : 'default-game';

    // Player B navigates to the same game
    await playerBPage.goto(`http://localhost:5173/game/${gameId}`);
    await playerBPage.waitForSelector('.leaflet-container');
}


beforeAll(async () => {
    // Launch two separate browsers for two different users
    browserA = await puppeteer.launch({slowMo: 20});
    browserB = await puppeteer.launch({slowMo: 20});

    playerAPage = await browserA.newPage();
    playerBPage = await browserB.newPage();

    // Set up two different users
    await setupNewUser(playerAPage);
    await setupNewUser(playerBPage);

    // Both players join the same game
    await joinSameGame(playerAPage, playerBPage, "Two Player Test Game");
}, 60000); // 60 second timeout for setup

describe("Two Player Territory Claiming", () => {
    test("When Player A claims territory, Player B should see it on their map", async () => {
        // Wait for both maps to load
        await playerAPage.waitForSelector('.leaflet-container');
        await playerBPage.waitForSelector('.leaflet-container');

        // Get initial franchise counts for both players
        const initialCountA = await getFranchiseCount(playerAPage);
        const initialCountB = await getFranchiseCount(playerBPage);


        // Player A places a franchise
        const franchisePlaced = await placeFranchiseAt(playerAPage, 0, 0);
        expect(franchisePlaced).toBe(true);

        // Wait for Player A's franchise count to update
        const updatedCountA = await getFranchiseCount(playerAPage);
        expect(updatedCountA).toBe(initialCountA + 1);

        // Wait for Player B to see the update via socket connection
        const playerBSawUpdate = await waitForFranchiseUpdate(playerBPage, initialCountB + 1);
        expect(playerBSawUpdate).toBe(true);

        const finalCountB = await getFranchiseCount(playerBPage);

        // Verify both players see the same total franchise count
        expect(finalCountB).toBe(updatedCountA);
    });

    test("Player B should not be able to place franchise in same location as Player A", async () => {
        // Player A places another franchise at a specific location
        const franchisePlacedA = await placeFranchiseAt(playerAPage, 50, 50);
        expect(franchisePlacedA).toBe(true);

        // Wait for the update to propagate
        await wait(2);

        // Player B clicks on the same location where Player A placed their franchise
        await clickOnTerritory(playerBPage, 50, 50);

        // The info card should NOT appear because the territory is already claimed
        const infoCardAppears = await checkInfoCardAppears(playerBPage);
        expect(infoCardAppears).toBe(false);
    });
    test("Both players can place franchises in different territories", async () => {
        const countABefore = await getFranchiseCount(playerAPage);
        const countBBefore = await getFranchiseCount(playerBPage);

        // Player A places franchise at one location
        const franchisePlacedA = await placeFranchiseAt(playerAPage, -100, -100);
        expect(franchisePlacedA).toBe(true);

        // Player B places franchise at different location
        const franchisePlacedB = await placeFranchiseAt(playerBPage, 100, 100);
        expect(franchisePlacedB).toBe(true);

        // Wait for updates to propagate
        await wait(3);

        // Both players should see both franchises
        const finalCountA = await getFranchiseCount(playerAPage);
        const finalCountB = await getFranchiseCount(playerBPage);

        expect(finalCountA).toBe(countABefore + 2);
        expect(finalCountB).toBe(countBBefore + 2);
        expect(finalCountA).toBe(finalCountB);
    });
});

afterAll(async () => {
    await browserA?.close();
    await browserB?.close();
});
