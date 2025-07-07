import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkImport() {
  try {
    const count = await prisma.populationPoint.count();
    console.log(`Population points in database: ${count.toLocaleString()}`);
    
    if (count > 0) {
      const sample = await prisma.populationPoint.findMany({
        take: 5,
        select: {
          latitude: true,
          longitude: true,
          population: true
        }
      });
      
      console.log('\nSample data:');
      sample.forEach((point, i) => {
        console.log(`${i+1}. Lat: ${point.latitude}, Lng: ${point.longitude}, Pop: ${point.population}`);
      });
    }
  } catch (error) {
    console.error('Error checking import:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkImport();