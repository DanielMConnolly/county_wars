import { importPopulationData, isFileAlreadyProcessed } from './populationUtils.js';
import { spawn } from 'child_process';
import fs from 'fs';
import readline from 'readline';
import path from 'path';

/**
 * Import population data from GeoTIFF files using GDAL
 * This script:
 * 1. Finds all .tif files in the current directory
 * 2. Converts each GeoTIFF to XYZ format using gdal_translate
 * 3. Filters out zero population points
 * 4. Imports data into the database
 */

// Get all .tif files in the current directory
const getTifFiles = () => {
  const currentDir = process.cwd();
  return fs.readdirSync(currentDir)
    .filter(file => file.endsWith('.tif'))
    .map(file => path.join(currentDir, file));
};

const tifFiles = getTifFiles();

console.log('GeoTIFF Population Data Import Script');
console.log('====================================');
console.log(`Found ${tifFiles.length} .tif files to process:`);
tifFiles.forEach((file, index) => {
  console.log(`  ${index + 1}. ${path.basename(file)}`);
});
console.log('');

// Check if GDAL is available
function checkGDAL() {
  return new Promise((resolve, reject) => {
    const gdal = spawn('gdalinfo', ['--version']);

    gdal.on('close', (code) => {
      if (code === 0) {
        console.log('✓ GDAL is available');
        resolve(true);
      } else {
        console.log('✗ GDAL not found. Please install GDAL first:');
        console.log('  macOS: brew install gdal');
        console.log('  Ubuntu: sudo apt-get install gdal-bin');
        reject(new Error('GDAL not available'));
      }
    });

    gdal.on('error', () => {
      reject(new Error('GDAL not available'));
    });
  });
}

// Convert GeoTIFF to XYZ format with reprojection to WGS84
function convertToXYZ(inputFile) {
  return new Promise((resolve, reject) => {
    console.log(`Converting ${path.basename(inputFile)} to XYZ format with reprojection to WGS84...`);

    const tempFile = `temp_wgs84_${Date.now()}.tif`;

    // First, reproject to WGS84
    const gdalwarp = spawn('gdalwarp', [
      '-s_srs', 'EPSG:54009',  // Source: Mollweide projection
      '-t_srs', 'EPSG:4326',   // Target: WGS84 lat/lng
      '-r', 'bilinear',        // Resampling method
      inputFile,
      tempFile
    ]);

    gdalwarp.stdout.on('data', (data) => {
      process.stdout.write(data);
    });

    gdalwarp.stderr.on('data', (data) => {
      process.stderr.write(data);
    });

    gdalwarp.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`gdalwarp failed with code ${code}`));
        return;
      }

      // Generate unique output file name
      const timestamp = Date.now();
      const outputFile = `population_xyz_output_${timestamp}.xyz`;
      
      // Now convert to XYZ
      const gdal = spawn('gdal_translate', [
        '-of', 'XYZ',
        tempFile,
        outputFile
      ]);

      gdal.stdout.on('data', (data) => {
        process.stdout.write(data);
      });

      gdal.stderr.on('data', (data) => {
        process.stderr.write(data);
      });

      gdal.on('close', (code) => {
        // Clean up temporary file
        try {
          fs.unlinkSync(tempFile);
        } catch (error) {
          console.log('Warning: Could not clean up temporary file:', error.message);
        }

        if (code === 0) {
          console.log('✓ Conversion completed');
          resolve(outputFile);
        } else {
          reject(new Error(`gdal_translate failed with code ${code}`));
        }
      });
    });
  });
}

// Import XYZ data into database
async function importXYZData(outputFile, sourceFileName) {
  console.log('Starting database import...');

  if (!fs.existsSync(outputFile)) {
    throw new Error(`Output file ${outputFile} not found`);
  }

  const fileStream = fs.createReadStream(outputFile);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let populationPoints = [];
  let lineCount = 0;
  let validCount = 0;
  const batchSize = 10000; // Process in batches

  for await (const line of rl) {
    lineCount++;

    if (lineCount % 100000 === 0) {
      console.log(`Processed ${lineCount.toLocaleString()} lines...`);
    }

    // Debug first few lines
    if (lineCount <= 5) {
      console.log(`Debug line ${lineCount}: "${line}"`);
    }

    const parts = line.trim().split(/\s+/);
    if (parts.length !== 3) {
      if (lineCount <= 10) {
        console.log(`Skipping line ${lineCount}: wrong parts count (${parts.length})`);
      }
      continue;
    }

    const longitude = parseFloat(parts[0]);
    const latitude = parseFloat(parts[1]);
    const population = parseFloat(parts[2]);

    // Debug first few valid lines
    if (lineCount <= 10) {
      console.log(`Line ${lineCount}: lng=${longitude}, lat=${latitude}, pop=${population}`);
    }

    // Filter out invalid data (allow 0 population, but exclude negative values which are nodata)
    if (isNaN(longitude) || isNaN(latitude) || isNaN(population) || population < 0) {
      if (lineCount <= 10) {
        console.log(`Filtering out line ${lineCount}: invalid data (lng=${longitude}, lat=${latitude}, pop=${population})`);
      }
      continue;
    }

    // Validate coordinate ranges
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      if (lineCount <= 10) {
        console.log(`Filtering out line ${lineCount}: out of bounds (lng=${longitude}, lat=${latitude})`);
      }
      continue;
    }

    populationPoints.push({
      latitude: latitude,
      longitude: longitude,
      population: Math.round(population), // Round to integer
      sourceFile: sourceFileName
    });

    validCount++;

    // Debug first few valid points
    if (validCount <= 5) {
      console.log(`Added valid point ${validCount}: lat=${latitude}, lng=${longitude}, pop=${Math.round(population)}, source=${sourceFileName}`);
    }

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

  // Clean up temporary file
  try {
    fs.unlinkSync(outputFile);
    console.log('✓ Temporary XYZ file cleaned up');
  } catch (error) {
    console.log('Warning: Could not clean up temporary file:', error.message);
  }
}

// Process a single TIF file
async function processTifFile(inputFile, fileIndex, totalFiles) {
  try {
    const fileName = path.basename(inputFile);
    console.log(`\n📁 Processing file ${fileIndex}/${totalFiles}: ${fileName}`);
    console.log(`File size: ${(fs.statSync(inputFile).size / (1024 * 1024)).toFixed(2)} MB`);

    // Check if this file has already been processed
    console.log(`Checking if ${fileName} has already been processed...`);
    const alreadyProcessed = await isFileAlreadyProcessed(fileName);
    
    if (alreadyProcessed) {
      console.log(`⏭️  Skipping ${fileName} - already processed`);
      return;
    }

    console.log(`✓ ${fileName} not found in database, proceeding with import...`);

    // Convert GeoTIFF to XYZ
    const outputFile = await convertToXYZ(inputFile);

    // Import into database
    await importXYZData(outputFile, fileName);

    console.log(`✅ Successfully processed ${fileName}`);

  } catch (error) {
    console.error(`❌ Failed to process ${path.basename(inputFile)}:`, error.message);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    // Set up Heroku database URL if not already set
    if (!process.env.DATABASE_URL) {
      console.log('DATABASE_URL not set, attempting to get from Heroku...');
      try {
        const { execSync } = await import('child_process');
        const databaseUrl = execSync('heroku config:get DATABASE_URL --app franchise-wars', { encoding: 'utf8' }).trim();
        process.env.DATABASE_URL = databaseUrl;
        console.log('✓ Database URL obtained from Heroku');
      } catch (error) {
        console.error('Failed to get database URL from Heroku. Please set DATABASE_URL environment variable.');
        throw error;
      }
    }

    if (tifFiles.length === 0) {
      throw new Error('No .tif files found in the current directory');
    }

    // Check GDAL availability
    await checkGDAL();

    let successCount = 0;
    let skippedCount = 0;
    let failedFiles = [];

    // Process each TIF file
    for (let i = 0; i < tifFiles.length; i++) {
      const inputFile = tifFiles[i];
      const fileName = path.basename(inputFile);
      
      try {
        // Check if input file exists
        if (!fs.existsSync(inputFile)) {
          throw new Error(`Input file ${inputFile} not found`);
        }

        // Check if file was already processed (for summary reporting)
        const alreadyProcessed = await isFileAlreadyProcessed(fileName);
        
        await processTifFile(inputFile, i + 1, tifFiles.length);
        
        if (alreadyProcessed) {
          skippedCount++;
        } else {
          successCount++;
        }
      } catch (error) {
        console.error(`Failed to process ${fileName}:`, error.message);
        failedFiles.push(fileName);
        // Continue with next file instead of exiting
      }
    }

    console.log('\n🎉 Batch import completed!');
    console.log(`Successfully processed: ${successCount}/${tifFiles.length} files`);
    console.log(`Skipped (already processed): ${skippedCount}/${tifFiles.length} files`);
    
    if (failedFiles.length > 0) {
      console.log(`Failed files: ${failedFiles.join(', ')}`);
    }
    
    console.log('The population database now contains data from all successfully processed files.');

  } catch (error) {
    console.error('\n❌ Import failed:', error.message);
    process.exit(1);
  } finally {
    // Clean up database connection
    const { closeConnection } = await import('./populationUtils.js');
    await closeConnection();
  }
}

main();
