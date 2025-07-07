import express from 'express';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Serve static files from the project root
app.use(express.static(path.join(__dirname)));

// Serve node_modules for dependencies
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

// Serve the test runner
app.get('/test', (req, res) => {
    res.sendFile(path.join(__dirname, 'tests', 'browser-test-runner.html'));
});

// Serve the main app for comparison
app.get('/', (req, res) => {
    res.send(`
        <html>
            <head>
                <title>County Wars Test Environment</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; background: #1f2937; color: white; }
                    .container { max-width: 800px; margin: 0 auto; }
                    .link-box { 
                        display: inline-block; 
                        background: #3b82f6; 
                        color: white; 
                        padding: 15px 25px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        margin: 10px;
                        transition: background 0.3s;
                    }
                    .link-box:hover { background: #2563eb; }
                    h1 { color: #60a5fa; }
                    p { color: #d1d5db; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>County Wars Test Environment</h1>
                    <p>Choose an option to test the GameMap component:</p>
                    
                    <a href="/test" class="link-box">
                        🧪 Browser Test Runner<br>
                        <small>Interactive test suite in browser</small>
                    </a>
                    
                    <a href="http://localhost:3000" class="link-box" target="_blank">
                        🎮 Main Application<br>
                        <small>Full County Wars game</small>
                    </a>
                    
                    <h2>Running Tests</h2>
                    <p><strong>Browser Tests:</strong> Click "Browser Test Runner" above to run GameMap tests in a real browser environment with actual Leaflet rendering.</p>
                    
                    <p><strong>Jest Tests:</strong> Run in terminal with:</p>
                    <code style="background: #374151; padding: 10px; display: block; border-radius: 4px; margin: 10px 0;">
                        npm run test:frontend -- GameMap.test.tsx
                    </code>
                    
                    <h2>Test Features</h2>
                    <ul>
                        <li>Real Leaflet map rendering</li>
                        <li>Actual county geojson processing</li>
                        <li>Interactive county selection testing</li>
                        <li>Visual verification of map behavior</li>
                        <li>Network request simulation</li>
                    </ul>
                </div>
            </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(`🧪 County Wars Test Server running at http://localhost:${PORT}`);
    console.log(`📊 Browser tests available at http://localhost:${PORT}/test`);
    console.log(`🎮 Make sure your main app is running at http://localhost:3000`);
    
    // Auto-open browser to test page
    const open = process.platform === 'darwin' ? 'open' : 
                 process.platform === 'win32' ? 'start' : 'xdg-open';
    
    spawn(open, [`http://localhost:${PORT}`]);
});