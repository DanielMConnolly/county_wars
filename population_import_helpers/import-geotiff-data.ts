import { spawn, ChildProcess, execSync } from 'child_process';
import fs from 'fs';
import readline from 'readline';
import path from 'path';
import { PrismaClient } from '@prisma/client';

interface PopulationPoint {
  latitude: number;
  longitude: number;
  population: number;
  sourceFile: string;
}

// Fetch database URL from Heroku
function getDatabaseUrl(): string {
  try {
    const databaseUrl: string = execSync('heroku config:get DATABASE_URL --app franchise-wars', {
      encoding: 'utf8',
    }).trim();
    console.log('✓ Database URL obtained from Heroku');
    return databaseUrl;
  } catch (error: any) {
    console.error(
      'Failed to get database URL from Heroku. Please ensure Heroku CLI is installed and authenticated.'
    );
    throw error;
  }
}

// Create Prisma client with Heroku database URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: getDatabaseUrl(),
    },
  },
});

// Bulk import population data (for initial data loading)
async function importPopulationData(populationData: PopulationPoint[]): Promise<void> {
  // Data is already batched by the calling function, so import directly

  // Add sourceFile to each record if not present
  const dataWithSourceFile = populationData.map(point => ({
    ...point,
    sourceFile: point.sourceFile || 'manual_import',
  }));

  try {
    await prisma.populationPoint.createMany({
      data: dataWithSourceFile,
      skipDuplicates: true,
    });
  } catch (error: any) {
    console.error(`[ERROR] Failed to import data:`, error);
    throw error;
  }
}

// Check if a source file has already been processed
async function isFileAlreadyProcessed(sourceFile: string): Promise<boolean> {
  const count: number = await prisma.populationPoint.count({
    where: {
      sourceFile: sourceFile,
    },
  });
  return count > 0;
}

// Close the Prisma connection when done
async function closeConnection(): Promise<void> {
  await prisma.$disconnect();
}

/**
 * Import population data from GeoTIFF files using GDAL
 * This script:
 * 1. Finds all .tif files in the current directory
 * 2. Converts each GeoTIFF to XYZ format using gdal_translate
 * 3. Filters out zero population points
 * 4. Imports data into the database
 */

// Get all .tif files in the current directory
const getTifFiles = (): string[] => {
  const currentDir: string = process.cwd();
  return fs
    .readdirSync(currentDir)
    .filter((file: string) => file.endsWith('.tif'))
    .map((file: string) => path.join(currentDir, file));
};

const tifFiles: string[] = getTifFiles();

console.log('GeoTIFF Population Data Import Script');
console.log('====================================');
console.log(`Found ${tifFiles.length} .tif files to process:`);
tifFiles.forEach((file, index) => {
  console.log(`  ${index + 1}. ${path.basename(file)}`);
});
console.log('');

// Check if GDAL is available
function checkGDAL(): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const gdal: ChildProcess = spawn('gdalinfo', ['--version']);

    gdal.on('close', (code: number | null) => {
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
function convertToXYZ(inputFile: string): Promise<string> {
  return new Promise((resolve, reject) => {
    console.log(
      `Converting ${path.basename(inputFile)} to XYZ format with reprojection to WGS84...`
    );

    const tempFile: string = `temp_wgs84_${Date.now()}.tif`;

    // First, reproject to WGS84
    const gdalwarp: ChildProcess = spawn('gdalwarp', [
      '-s_srs',
      'EPSG:54009', // Source: Mollweide projection
      '-t_srs',
      'EPSG:4326', // Target: WGS84 lat/lng
      '-r',
      'bilinear', // Resampling method
      inputFile,
      tempFile,
    ]);

    gdalwarp.stdout?.on('data', (data: Buffer) => {
      process.stdout.write(data);
    });

    gdalwarp.stderr?.on('data', (data: Buffer) => {
      process.stderr.write(data);
    });

    gdalwarp.on('close', (code: number | null) => {
      if (code !== 0) {
        reject(new Error(`gdalwarp failed with code ${code}`));
        return;
      }

      // Generate unique output file name
      const timestamp: number = Date.now();
      const outputFile: string = `population_xyz_output_${timestamp}.xyz`;

      // Now convert to XYZ
      const gdal: ChildProcess = spawn('gdal_translate', ['-of', 'XYZ', tempFile, outputFile]);

      gdal.stdout?.on('data', (data: Buffer) => {
        process.stdout.write(data);
      });

      gdal.stderr?.on('data', (data: Buffer) => {
        process.stderr.write(data);
      });

      gdal.on('close', (code: number | null) => {
        // Clean up temporary file
        try {
          fs.unlinkSync(tempFile);
        } catch (error: any) {
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
async function importXYZData(outputFile: string, sourceFileName: string): Promise<void> {
  console.log('Starting database import...');

  if (!fs.existsSync(outputFile)) {
    throw new Error(`Output file ${outputFile} not found`);
  }

  const fileStream: fs.ReadStream = fs.createReadStream(outputFile);
  const rl: readline.Interface = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let populationPoints: PopulationPoint[] = [];
  let lineCount: number = 0;
  let validCount: number = 0;
  const batchSize: number = 10000; // Process in batches

  for await (const line of rl) {
    lineCount++;

    if (lineCount % 100000 === 0) {
      console.log(`Processed ${lineCount.toLocaleString()} lines...`);
    }

    // Debug first few lines
    if (lineCount <= 5) {
      console.log(`Debug line ${lineCount}: "${line}"`);
    }

    const parts: string[] = line.trim().split(/\s+/);
    if (parts.length !== 3) {
      if (lineCount <= 10) {
        console.log(`Skipping line ${lineCount}: wrong parts count (${parts.length})`);
      }
      continue;
    }

    const longitude: number = parseFloat(parts[0]);
    const latitude: number = parseFloat(parts[1]);
    const population: number = parseFloat(parts[2]);

    // Debug first few valid lines
    if (lineCount <= 10) {
      console.log(`Line ${lineCount}: lng=${longitude}, lat=${latitude}, pop=${population}`);
    }

    // Filter out invalid data (allow 0 population, but exclude negative values which are nodata)
    if (isNaN(longitude) || isNaN(latitude) || isNaN(population) || population < 0) {
      if (lineCount <= 10) {
        console.log(
          `Filtering out line ${lineCount}: invalid data (lng=${longitude}, lat=${latitude}, pop=${population})`
        );
      }
      continue;
    }

    // Validate coordinate ranges
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      if (lineCount <= 10) {
        console.log(
          `Filtering out line ${lineCount}: out of bounds (lng=${longitude}, lat=${latitude})`
        );
      }
      continue;
    }

    populationPoints.push({
      latitude: latitude,
      longitude: longitude,
      population: Math.round(population), // Round to integer
      sourceFile: sourceFileName,
    });

    validCount++;

    // Debug first few valid points
    if (validCount <= 5) {
      console.log(
        `Added valid point ${validCount}: lat=${latitude}, lng=${longitude}, pop=${Math.round(population)}, source=${sourceFileName}`
      );
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
  } catch (error: any) {
    console.log('Warning: Could not clean up temporary file:', error.message);
  }
}

// Process a single TIF file
async function processTifFile(
  inputFile: string,
  fileIndex: number,
  totalFiles: number
): Promise<void> {
  try {
    const fileName: string = path.basename(inputFile);
    console.log(`\n📁 Processing file ${fileIndex}/${totalFiles}: ${fileName}`);
    console.log(`File size: ${(fs.statSync(inputFile).size / (1024 * 1024)).toFixed(2)} MB`);

    // Check if this file has already been processed
    console.log(`Checking if ${fileName} has already been processed...`);
    const alreadyProcessed: boolean = await isFileAlreadyProcessed(fileName);

    if (alreadyProcessed) {
      console.log(`⏭️  Skipping ${fileName} - already processed`);
      return;
    }

    console.log(`✓ ${fileName} not found in database, proceeding with import...`);

    // Convert GeoTIFF to XYZ
    const outputFile: string = await convertToXYZ(inputFile);

    // Import into database
    await importXYZData(outputFile, fileName);

    console.log(`✅ Successfully processed ${fileName}`);
  } catch (error: any) {
    console.error(`❌ Failed to process ${path.basename(inputFile)}:`, error.message);
    throw error;
  }
}

// Main execution
async function main(): Promise<void> {
  try {
    if (tifFiles.length === 0) {
      throw new Error('No .tif files found in the current directory');
    }

    // Check GDAL availability
    await checkGDAL();

    let successCount: number = 0;
    let skippedCount: number = 0;
    let failedFiles: string[] = [];

    // Process each TIF file
    for (let i = 0; i < tifFiles.length; i++) {
      const inputFile: string = tifFiles[i];
      const fileName: string = path.basename(inputFile);

      try {
        if (!fs.existsSync(inputFile)) {
          throw new Error(`Input file ${inputFile} not found`);
        }

        const alreadyProcessed: boolean = await isFileAlreadyProcessed(fileName);

        await processTifFile(inputFile, i + 1, tifFiles.length);

        if (alreadyProcessed) {
          skippedCount++;
        } else {
          successCount++;
        }
      } catch (error: any) {
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
  } catch (error: any) {
    console.error('\n❌ Import failed:', error.message);
    process.exit(1);
  } finally {
    // Clean up database connection
    await closeConnection();
  }
}

main();
