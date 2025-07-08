import {ChildProcess, spawn} from 'child_process';
import { Browser} from "puppeteer";

const PORT = 5173;
const SERVER_PORT = 3001;


declare global {
  var __SERVER_PROCESS__: ChildProcess | undefined;
  var __CLIENT_PROCESS__: ChildProcess | undefined;
  var __BROWSER_GLOBAL__: Browser | undefined;
}

const waitForServer = async (url: string, timeout = 50000) => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      // eslint-disable-next-line no-undef
      await fetch(url, { signal: AbortSignal.timeout(5000) });
      return true;
    } catch (_e) {
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error(`Server not ready after ${timeout}ms`);
};

export async function setup(): Promise<void> {

  // Initialize test database schema
  const { execSync } = require('child_process');
  try {
    // Create test database if it doesn't exist
    execSync('createdb county_wars_test 2>/dev/null || echo "Test database may already exist"', {
      stdio: 'inherit'
    });
    
    execSync('npx prisma db push --accept-data-loss', {
      env: {
        ...process.env,
        DATABASE_URL: 'postgresql://danconnolly@localhost:5432/county_wars_test?schema=public'
      },
      stdio: 'inherit'
    });
  } catch (error) {
    throw error;
  }

  // Start server with test database
  const serverProcess = spawn('npm', ['run', 'server'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://danconnolly@localhost:5432/county_wars_test?schema=public'
    }
  });

  // Log server errors for debugging
  serverProcess.stderr?.on('data', (data) => {
  });

  // Store server process globally for teardown
  // eslint-disable-next-line no-undef
  global.__SERVER_PROCESS__ = serverProcess;

  // Wait for server to be ready (check server port)
  await waitForServer(`http://localhost:${SERVER_PORT}`);


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

};

export default setup;
