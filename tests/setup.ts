import {ChildProcess, spawn} from 'child_process';
// @ts-ignore
import puppeteerBlockResources from 'puppeteer-extra-plugin-user-preferences';
import puppeteer from 'puppeteer-extra';
import { Page, Browser} from "puppeteer";
import { mkdir, writeFile } from 'fs';
import path from 'path';
import os from 'os';

const PORT = 5173;
const SERVER_PORT = 3001;

const DIR = path.join(os.tmpdir(), 'jest_puppeteer_global_setup');


declare global {
  var __SERVER_PROCESS__: ChildProcess | undefined;
  var __CLIENT_PROCESS__: ChildProcess | undefined;
  var __BROWSER_GLOBAL__: Browser | undefined;
}

const waitForServer = async (url: string, timeout = 50000) => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    console.log('Checking if server is ready');
    try {
      // eslint-disable-next-line no-undef
      await fetch(url, { signal: AbortSignal.timeout(5000) });
      return true;
    } catch (_e) {
      console.log('Server not ready yet');
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error(`Server not ready after ${timeout}ms`);
};

export async function setupTestPage(): Promise<Page> {


  const browser = globalThis.__BROWSER_GLOBAL__ as Browser;

  const testPage = await browser.newPage();
  testPage.setDefaultNavigationTimeout(60000);
  testPage.setDefaultTimeout(60000000);
  return testPage;
}



export async function teardownBrowser(): Promise<void> {
    if (globalThis.__BROWSER_GLOBAL__) {
      await globalThis.__BROWSER_GLOBAL__.close();
    }
}

export async function setup(): Promise<void> {
  console.log('Starting test servers...');

  // Start server with test database
  const serverProcess = spawn('npm', ['run', 'server'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      NODE_ENV: 'test',
      TEST_DATABASE_PATH: './test_database.db'
    }
  });

  // Store server process globally for teardown
  // eslint-disable-next-line no-undef
  global.__SERVER_PROCESS__ = serverProcess;

  // Wait for server to be ready (check server port)
  await waitForServer(`http://localhost:${SERVER_PORT}`);
  console.log(`Server ready at http://localhost:${SERVER_PORT}`);

  console.log('Starting Vite dev server...');

  // Start client
  const clientProcess = spawn('npm', ['run', 'dev'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      PORT: PORT.toString(),
      NODE_ENV: 'test'
    }
  });

  //eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Please fix as you edit this code
  // eslint-disable-next-line no-undef
  global.__CLIENT_PROCESS__ = clientProcess;

  // Wait for client to be ready
  await waitForServer(`http://localhost:${PORT}`);
  console.log(`Vite server ready at http://localhost:${PORT}`);

  puppeteer.use(puppeteerBlockResources(({
    userPrefs: {
      safebrowsing: {
        enabled: false,
        enhanced: false
      }
    }
  })));

  const browser = await puppeteer.launch({
    headless: false,
  });
  globalThis.__BROWSER_GLOBAL__ = browser;

  await mkdir(DIR, { recursive: true },(err) => {
    if (err) throw err;
});
  await writeFile(path.join(DIR, 'wsEndpoint'), browser.wsEndpoint(), (err) => {
    if (err) throw err;
});

};

export default setup;
