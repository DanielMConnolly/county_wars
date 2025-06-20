const { spawn } = require("child_process");

const PORT = 5173;
const SERVER_PORT = 3001;

const waitForServer = async (url, timeout = 30000) => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    console.log('Checking if server is ready');
    try {
      const response = await fetch(url);
      console.log('Server ready: ', response);
      return true;
    } catch (_e) {
      console.log('Server not ready yet');
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error(`Server not ready after ${timeout}ms`);
};

module.exports = async function setup() {
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

  // Store client process globally for teardown
  global.__CLIENT_PROCESS__ = clientProcess;

  // Wait for client to be ready
  await waitForServer(`http://localhost:${PORT}`);
  console.log(`Vite server ready at http://localhost:${PORT}`);
};