import { importPopulationData, closeConnection } from './populationUtils.js';
import fs from 'fs';
import readline from 'readline';
import path from 'path';

// Convert Web Mercator (EPSG:3857) to WGS84 lat/lng (EPSG:4326)
function webMercatorToLatLng(x, y) {
  const earthRadius = 6378137; // Earth's radius in meters
  
  // Convert x to longitude
  const lng = (x / earthRadius) * (180 / Math.PI);
  
  // Convert y to latitude
  const lat = (Math.PI / 2 - 2 * Math.atan(Math.exp(-y / earthRadius))) * (180 / Math.PI);
  
  return { latitude: lat, longitude: lng };
}

async function importXYZFile(filePath) {
  console.log('Starting population data import...');
  console.log(`Reading file: ${filePath}`);
  
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let populationPoints = [];
  let lineCount = 0;
  let validCount = 0;
  const batchSize = 10000; // Process in batches to avoid memory issues

  for await (const line of rl) {
    lineCount++;
    
    if (lineCount % 100000 === 0) {
      console.log(`Processed ${lineCount.toLocaleString()} lines...`);
    }

    const parts = line.trim().split(/\s+/);
    if (parts.length !== 3) continue;

    const x = parseFloat(parts[0]);
    const y = parseFloat(parts[1]);
    const population = parseInt(parts[2]);

    if (isNaN(x) || isNaN(y) || isNaN(population) || population <= 0) {
      continue;
    }

    // Convert from Web Mercator to lat/lng
    const { latitude, longitude } = webMercatorToLatLng(x, y);
    
    // Filter out invalid coordinates (outside reasonable bounds)
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      continue;
    }

    // Optional: Filter to focus on specific regions (e.g., US bounds)
    // Uncomment the next lines to import only US data
    // if (latitude < 24 || latitude > 50 || longitude < -130 || longitude > -65) {
    //   continue;
    // }

    populationPoints.push({
      latitude: latitude,
      longitude: longitude,
      population: population,
      sourceFile: path.basename(filePath)
    });

    validCount++;

    // Import in batches
    if (populationPoints.length >= batchSize) {
      console.log(`Importing batch of ${populationPoints.length} points...`);
      await importPopulationData(populationPoints);
      populationPoints = [];
    }
  }

  // Import remaining points
  if (populationPoints.length > 0) {
    console.log(`Importing final batch of ${populationPoints.length} points...`);
    await importPopulationData(populationPoints);
  }

  console.log(`\nImport complete!`);
  console.log(`Total lines processed: ${lineCount.toLocaleString()}`);
  console.log(`Valid population points imported: ${validCount.toLocaleString()}`);
}

// Run the import
const filePath = process.argv[2] || './filtered_population.xyz';

console.log('Population Data Import Script');
console.log('============================');
console.log(`File: ${filePath}`);
console.log('');

importXYZFile(filePath)
  .then(async () => {
    console.log('Import successful!');
    await closeConnection();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('Import failed:', error);
    await closeConnection();
    process.exit(1);
  });