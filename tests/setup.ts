import {ChildProcess, spawn} from 'child_process';

const PORT = 5173;
const SERVER_PORT = 3001;

declare global {
  var __SERVER_PROCESS__: ChildProcess | undefined;
  var __CLIENT_PROCESS__: ChildProcess | undefined;
}

const waitForServer = async (url: string, timeout = 50000) => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    console.log('Checking if server is ready');
    try {
      await fetch(url);
      console.log('Server ready');
      return true;
    } catch (_e) {
      console.log('Server not ready yet');
    }
    await new Promise(resolve => setTimeout(resolve, 10000));
  }
  throw new Error(`Server not ready after ${timeout}ms`);
};

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
};
