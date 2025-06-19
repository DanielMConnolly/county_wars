
import "jest-puppeteer";
import "expect-puppeteer";
import '@testing-library/jest-dom';
import puppeteer, { Page, Browser } from 'puppeteer';
import { svg } from "leaflet";

let testPage: Page;
let browser: Browser;

beforeAll(async () => {
  browser = await puppeteer.launch({
    headless: false,
  });
  testPage = await browser.newPage();
  await testPage.goto("http://localhost:5173");
});

describe("County Wars GameMap", () => {
  test("should load the County Wars application", async () => {
    await expect(testPage).toMatchTextContent(/County Conquest/);
  });

  test("should have a map container", async () => {
    await testPage.waitForSelector('.leaflet-container', { timeout: 10000 });
    const mapContainer = await testPage.$('.leaflet-container');
    expect(mapContainer).toBeTruthy();
  });

  test("should load counties on the map", async () => {
    await testPage.waitForSelector('.leaflet-overlay-pane svg', { timeout: 15000 });
    const svgElements = await testPage.$$('.leaflet-overlay-pane svg path');
    expect(svgElements.length).toBeGreaterThan(0);
    await svgElements[1].click();
    const infoCardElement = await testPage.$$('[data-testid="info-card"]');
    expect(infoCardElement.length).toBeGreaterThan(0);
    await testPage.click('[data-testid="conquer-county-button"]');

  });
});

afterAll(async () => {
  if (browser) {
    await browser.close();
  }
})
