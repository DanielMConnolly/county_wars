import { ElementHandle, Page } from 'puppeteer';
import { DataTestIDs } from '../src/DataTestIDs';

export const wait = async (seconds: number) => {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
};

export const clickOnTerritory = async (page: Page, offsetX: number = 0, offsetY: number = 0) => {
    const viewport = page.viewport();
    const viewportWidth = viewport!.width;
    const viewportHeight = viewport!.height;
    const centerX = viewportWidth / 2 + offsetX;
    const centerY = viewportHeight / 2 + offsetY;
    await page.mouse.click(centerX, centerY);
};

export const getFranchiseCount = async (page: Page): Promise<number> => {
    try {
        await page.waitForSelector(`[data-testid="${DataTestIDs.FRANCHISE_COUNT}"]`, { timeout: 5000 });
        const countText = await page.$eval(`[data-testid="${DataTestIDs.FRANCHISE_COUNT}"]`, el => el.textContent);
        const match = countText?.match(/(\d+)/);
        return match ? parseInt(match[1]) : 0;
    } catch (error) {
        return 0;
    }
};

export const placeFranchiseAt = async (page: Page, offsetX: number = 0, offsetY: number = 0, retries: number = 3): Promise<boolean> => {
    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            await clickOnTerritory(page, offsetX + (attempt * 10), offsetY + (attempt * 10));
            await page.waitForSelector(`[data-testid="${DataTestIDs.INFO_CARD}"]`, { timeout: 8000 });
            
            // Check if place franchise button exists and is enabled
            const placeFranchiseButton = await page.$(`[data-testid="${DataTestIDs.PLACE_FRANCHISE_BUTTON}"]`);
            if (!placeFranchiseButton) {
                continue;
            }
            
            const isDisabled = await page.evaluate(el => 
                el.className.includes('cursor-not-allowed') || el.hasAttribute('disabled'), 
                placeFranchiseButton
            );
            
            if (isDisabled) {
                continue;
            }
            
            await page.click(`[data-testid="${DataTestIDs.PLACE_FRANCHISE_BUTTON}"]`);
            await page.click(`[data-testid="${DataTestIDs.CLOSE_INFO_CARD_BUTTON}"]`);
            return true;
        } catch (error) {
            if (attempt === retries - 1) {
            }
        }
    }
    return false;
};

export const waitForFranchiseUpdate = async (page: Page, expectedCount: number, timeout: number = 10000): Promise<boolean> => {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        const currentCount = await getFranchiseCount(page);
        if (currentCount >= expectedCount) {
            return true;
        }
        await wait(0.5);
    }
    return false;
};

export const placeFranchise = async (testPage: Page, svgElements: Array<ElementHandle<any>>) => {
    const countyNumber = Math.floor(Math.random() * 3001)
    await svgElements[countyNumber].click();

    await testPage.waitForSelector(`[data-testid="${DataTestIDs.INFO_CARD}"]`);
    await testPage.click(`[data-testid="${DataTestIDs.PLACE_FRANCHISE_BUTTON}"]`);
};
