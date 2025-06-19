import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

let viteProcess;
const PORT = 5173;
const BASE_URL = `http://localhost:${PORT}`;

// Write the URL to a file that tests can read
const writeTestConfig = async () => {
  const config = { baseUrl: BASE_URL };
  await fs.writeFile(
    path.join(process.cwd(), 'test-config.json'),
    JSON.stringify(config, null, 2)
  );
};

const waitForServer = async (url, timeout = 30000) => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const response = await fetch(url);
      if (response.ok) return true;
    } catch (e) {
      // Server not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error(`Server not ready after ${timeout}ms`);
};

export default async function setup() {
  console.log('Starting Vite dev server...');
  
  viteProcess = spawn('npm', ['run', 'dev'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, PORT: PORT.toString() }
  });

  // Wait for server to be ready
  await waitForServer(BASE_URL);
  
  // Write config for tests
  await writeTestConfig();
  
  console.log(`Vite server ready at ${BASE_URL}`);
  
  // Store process globally for teardown
  global.__VITE_PROCESS__ = viteProcess;
}