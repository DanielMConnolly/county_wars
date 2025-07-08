# Population Data Setup Guide

## Overview
This guide explains how to populate the database with global population data for the `/api/population-radius` endpoint.

## Data Source
We recommend using the **Global Human Settlement Layer (GHSL) Population Grid** from the European Commission's Joint Research Centre.

### Download Data
1. Visit: https://ghsl.jrc.ec.europa.eu/download.php
2. Select: **GHS-POP** (Population Grid)
3. Choose: **2020 or 2025 epoch** (most recent)
4. Resolution: **1 km** (good balance of accuracy and file size)
5. Format: **GeoTIFF** or **CSV**

### Data Processing Steps

#### Option 1: Using GDAL (Recommended)
```bash
# Install GDAL if not already installed
brew install gdal  # macOS
# or
apt-get install gdal-bin  # Ubuntu/Debian

# Convert GeoTIFF to XYZ format
gdal_translate -of XYZ input_population.tif output_population.xyz

# Filter out zero population cells
awk '$3 > 0' output_population.xyz > filtered_population.xyz
```

### Database Import

#### Local Development Database
```bash
# Set local database URL
export DATABASE_URL="postgresql://danconnolly@localhost:5432/county_wars?schema=public"

# Run import script
node import-population-data.js ./filtered_population.xyz
```

#### Heroku Production Database (postgresql-flat-75749)
```bash
# Use the provided script that automatically gets Heroku database URL
./import-to-heroku.sh ./filtered_population.xyz

# Or manually set the database URL and run import
export DATABASE_URL=$(heroku config:get DATABASE_URL --app franchise-wars)
node import-population-data.js ./filtered_population.xyz
```

#### Using Node.js Script (Legacy)
Create a script to import the data:

```javascript
// import-population-data.js
import { importPopulationData } from './populationUtils.js';
import fs from 'fs';
import csv from 'csv-parser';

const populationPoints = [];

fs.createReadStream('population_points.csv')
  .pipe(csv())
  .on('data', (row) => {
    populationPoints.push({
      latitude: parseFloat(row.latitude),
      longitude: parseFloat(row.longitude),
      population: parseInt(row.population)
    });
  })
  .on('end', async () => {
    console.log('Importing population data...');
    await importPopulationData(populationPoints);
    console.log('Import complete!');
  });
```

#### Using SQL (Direct Import)
```sql
-- Create temporary table
CREATE TEMP TABLE temp_population (
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    population INTEGER
);

-- Import CSV data
COPY temp_population FROM '/path/to/population_points.csv'
WITH (FORMAT CSV, HEADER);

-- Insert into main table
INSERT INTO population_points (latitude, longitude, population)
SELECT latitude, longitude, population
FROM temp_population
WHERE population > 0;

-- Clean up
DROP TABLE temp_population;
```

### File Size Considerations
- **Global data**: ~50-100GB (full resolution)
- **US only**: ~5-10GB
- **Filtered (population > 0)**: ~20-30% of original size

### Performance Tips
1. **Indexes**: Already created on (latitude, longitude) in schema
2. **Batch imports**: Use the `importPopulationData` function for large datasets
3. **Regional filtering**: Consider importing only specific regions initially
4. **Compression**: Use gzip for CSV files during transfer

### Testing
Test the API with known coordinates:
```bash
# New York City (should return high population)
curl "http://localhost:3001/api/population-radius?lat=40.7128&lng=-74.0060&radius=5000"

# Rural area (should return low population)
curl "http://localhost:3001/api/population-radius?lat=45.0000&lng=-110.0000&radius=5000"
```

### Troubleshooting
- **Large datasets**: Process in chunks to avoid memory issues
- **Coordinate systems**: Ensure data is in WGS84 (EPSG:4326)
- **Data quality**: Filter out negative or unrealistic population values
- **Performance**: Consider adding spatial indexes for large datasets

## Alternative Data Sources
- **WorldPop**: https://www.worldpop.org/
- **LandScan**: https://landscan.ornl.gov/
- **OpenStreetMap**: Via Overpass API (lower resolution)
