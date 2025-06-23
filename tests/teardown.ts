import { promises as fs } from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const killProcessOnPort = async (port: number) => {
  try {
    // Find process using the port
    const result = execSync(`lsof -ti:${port}`, { encoding: 'utf8' }).trim();
    if (result) {
      const pids = result.split('\n').filter(pid => pid.trim());
      for (const pid of pids) {
        try {
          execSync(`kill -9 ${pid.trim()}`);
          console.log(`Killed process ${pid} on port ${port}`);
        } catch (e) {
          console.log(`Failed to kill process ${pid}: ${e}`);
        }
      }
    }
  } catch (e) {
    // No process found on port, which is fine
    console.log(`No process found on port ${port}`);
  }
};

export default async function teardown() {
  await globalThis.__BROWSER_GLOBAL__?.close();
  console.log('Stopping test servers...');

  // Kill any remaining processes on the test ports
  await killProcessOnPort(3001);
  await killProcessOnPort(5173);

  // Clean up test database
  try {
    await fs.unlink(path.join(process.cwd(), 'test_database.db'));
    console.log('Test database cleaned up');
  } catch (e) {
    // File might not exist, ignore
  }

  // Clean up test config file
  try {
    await fs.unlink(path.join(process.cwd(), 'test-config.json'));
  } catch (e) {
    // File might not exist, ignore
  }

  console.log('Test cleanup completed');
}
