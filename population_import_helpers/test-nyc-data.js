import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testNYCData() {
  try {
    // NYC coordinates
    const nycLat = 40.7128;
    const nycLng = -74.0060;
    
    console.log(`Searching for population data near NYC (${nycLat}, ${nycLng})`);
    
    // Look for data within a 1 degree box around NYC
    const nearbyData = await prisma.populationPoint.findMany({
      where: {
        latitude: {
          gte: nycLat - 1,
          lte: nycLat + 1
        },
        longitude: {
          gte: nycLng - 1,
          lte: nycLng + 1
        }
      },
      take: 10,
      select: {
        latitude: true,
        longitude: true,
        population: true
      }
    });
    
    console.log(`Found ${nearbyData.length} points within 1 degree of NYC:`);
    nearbyData.forEach((point, i) => {
      console.log(`${i+1}. Lat: ${point.latitude}, Lng: ${point.longitude}, Pop: ${point.population}`);
    });
    
    // Check what bounds our data actually has
    const bounds = await prisma.populationPoint.aggregate({
      _min: {
        latitude: true,
        longitude: true
      },
      _max: {
        latitude: true,
        longitude: true
      }
    });
    
    console.log('\nData bounds:');
    console.log(`Latitude: ${bounds._min.latitude} to ${bounds._max.latitude}`);
    console.log(`Longitude: ${bounds._min.longitude} to ${bounds._max.longitude}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testNYCData();