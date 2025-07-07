import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearPopulationData() {
  try {
    console.log('Clearing existing population data...');
    
    const count = await prisma.populationPoint.count();
    console.log(`Found ${count.toLocaleString()} existing population points`);
    
    if (count > 0) {
      const result = await prisma.populationPoint.deleteMany({});
      console.log(`✓ Deleted ${result.count.toLocaleString()} population points`);
    } else {
      console.log('No existing data to clear');
    }
    
    console.log('Database is ready for new population data import');
    
  } catch (error) {
    console.error('Error clearing population data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearPopulationData();