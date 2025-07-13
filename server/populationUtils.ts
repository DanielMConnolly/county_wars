import { PrismaClient } from '@prisma/client';
import { GAME_DEFAULTS } from '../src/constants/gameDefaults';

const prisma = new PrismaClient();

// Haversine distance formula to calculate distance between two points
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate total population within a radius around a point
export async function calculatePopulationInRadius(
  centerLat: number,
  centerLng: number,
  radiusMeters: number = GAME_DEFAULTS.DEFAULT_RADIUS_METERS
): Promise<number> {
  // Calculate bounding box for efficient database query
  const latDegreeDistance = 111000; // Approximate meters per degree latitude
  const lngDegreeDistance = 111000 * Math.cos(centerLat * Math.PI / 180); // Adjust for longitude

  const latRange = radiusMeters / latDegreeDistance;
  const lngRange = radiusMeters / lngDegreeDistance;

  const minLat = Number(centerLat) - Number(latRange);
  const maxLat = Number(centerLat) + Number(latRange);
  const minLng = Number(centerLng) - Number(lngRange);
  const maxLng = Number(centerLng) + Number(lngRange);

  console.log(`[DEBUG] Bounding box: lat ${minLat} to ${maxLat}, lng ${minLng} to ${maxLng}`);

  // Get all population points within the bounding box
  const populationPoints = await prisma.populationPoint.findMany({
    where: {
      latitude: {
        gte: minLat,
        lte: maxLat
      },
      longitude: {
        gte: minLng,
        lte: maxLng
      }
    },
    select: {
      latitude: true,
      longitude: true,
      population: true
    }
  });

  let totalPopulation = 0;

  for (const point of populationPoints) {
    const distance = haversineDistance(
      centerLat,
      centerLng,
      point.latitude,
      point.longitude
    );

    if (distance <= radiusMeters) {
      totalPopulation += point.population;
    }
  }

  return totalPopulation;
}

// Get population around a point using default radius
export async function getPopulationAroundPoint(
  lat: number,
  lng: number
): Promise<number> {
  try {
    const radiusMeters = GAME_DEFAULTS.DEFAULT_RADIUS_METERS;
    const population = await calculatePopulationInRadius(lat, lng, radiusMeters);
    return population;
  } catch (_error) {
    return 0;
  }
}

// Check if a source file has already been processed
export async function isFileAlreadyProcessed(sourceFile: string): Promise<boolean> {
  const count = await prisma.populationPoint.count({
    where: {
      sourceFile: sourceFile
    }
  });
  return count > 0;
}

// Bulk import population data (for initial data loading)
export async function importPopulationData(populationData: Array<{
  latitude: number;
  longitude: number;
  population: number;
  sourceFile: string;
}>): Promise<void> {
  // Insert in batches to avoid memory issues
  const batchSize = 1000;

  for (let i = 0; i < populationData.length; i += batchSize) {
    const batch = populationData.slice(i, i + batchSize);
    await prisma.populationPoint.createMany({
      data: batch,
      skipDuplicates: true
    });
  }
}
