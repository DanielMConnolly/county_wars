import { ElementHandle, Page } from 'puppeteer';
import { DataTestIDs } from '../src/DataTestIDs';

export const placeFranchise = async (testPage: Page, svgElements: Array<ElementHandle<any>>) => {
    const countyNumber = Math.floor(Math.random() * 3001)
    console.log("countyNumber: " + countyNumber);
    await svgElements[countyNumber].click();

    await testPage.waitForSelector(`[data-testid="${DataTestIDs.INFO_CARD}"]`);
    await testPage.click(`[data-testid="${DataTestIDs.PLACE_FRANCHISE_BUTTON}"]`);
}