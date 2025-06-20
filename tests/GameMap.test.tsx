
// import "jest-puppeteer";
// import "expect-puppeteer";
// import '@testing-library/jest-dom';
// import puppeteer, { Page, Browser } from 'puppeteer';
// import { spawn } from "child_process";

// let testPage: Page;
// let browser: Browser;

// beforeAll(async () => {
//   await setup();
//   browser = await puppeteer.launch({
//     headless: false,
//   });
//   testPage = await browser.newPage();
//   await testPage.goto("http://localhost:5173");
// });

// describe("County Wars GameMap", () => {
//   test("should load the County Wars application", async () => {
//     await expect(testPage).toMatchTextContent(/County Conquest/);
//   });

//   test("should have a map container", async () => {
//     await testPage.waitForSelector('.leaflet-container', { timeout: 10000 });
//     const mapContainer = await testPage.$('.leaflet-container');
//     expect(mapContainer).toBeTruthy();
//   });

//   test("should load counties on the map", async () => {
//     await testPage.waitForSelector('.leaflet-overlay-pane svg', { timeout: 15000 });
//     const svgElements = await testPage.$$('.leaflet-overlay-pane svg path');
//     expect(svgElements.length).toBeGreaterThan(0);
//     await svgElements[1].click();
//     const infoCardElement = await testPage.$$('[data-testid="info-card"]');
//     expect(infoCardElement.length).toBeGreaterThan(0);
//     await testPage.click('[data-testid="conquer-county-button"]');

//   });
// });

// afterAll(async () => {
//   if (browser) {
//     await browser.close();
//   }
// })



// const PORT = 5173;
// const BASE_URL = `http://localhost:${PORT}`;


// const waitForServer = async (url: string, timeout = 30000) => {
//   const start = Date.now();
//   while (Date.now() - start < timeout) {
//     console.log('Checking if server is ready');
//     try {
//       console.log('Checking if server is ready');
//       const response = await fetch(url);
//       console.log('Server ready');
//       if (response.ok) return true;
//     } catch (e) {
//       console.log('Server not ready yet');
//       // Server not ready yet
//     }
//     await new Promise(resolve => setTimeout(resolve, 1000));
//   }
//   throw new Error(`Server not ready after ${timeout}ms`);
// };

// export default async function setup() {
//   console.log('Starting Vite dev server...');

//   spawn('npm', ['run', 'dev'], {
//     stdio: ['ignore', 'pipe', 'pipe'],
//     env: { ...process.env, PORT: PORT.toString() }
//   });

//   // Wait for server to be ready
//   await waitForServer(BASE_URL);
//   console.log('Vite server ready at', BASE_URL);


// }
