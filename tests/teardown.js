import { promises as fs } from 'fs';
import path from 'path';

export default async function teardown() {
  console.log('Stopping Vite dev server...');
  
  const viteProcess = global.__VITE_PROCESS__;
  if (viteProcess) {
    viteProcess.kill();
  }
  
  // Clean up test config file
  try {
    await fs.unlink(path.join(process.cwd(), 'test-config.json'));
  } catch (e) {
    // File might not exist, ignore
  }
  
  console.log('Vite server stopped');
}