import { PrismaClient } from '@prisma/client';

// Create Prisma client with environment variable database URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Bulk import population data (for initial data loading)
export async function importPopulationData(populationData) {
  // Insert in batches to avoid memory issues
  const batchSize = 1000;

  for (let i = 0; i < populationData.length; i += batchSize) {
    const batch = populationData.slice(i, i + batchSize);

    // Add sourceFile to each record if not present
    const batchWithSourceFile = batch.map(point => ({
      ...point,
      sourceFile: point.sourceFile || 'manual_import'
    }));

    try {
      await prisma.populationPoint.createMany({
        data: batchWithSourceFile,
        skipDuplicates: true
      });
    } catch (error) {
      console.error(`[ERROR] Failed to import batch ${Math.floor(i / batchSize) + 1}:`, error);
      throw error;
    }
  }
}

// Check if a source file has already been processed
export async function isFileAlreadyProcessed(sourceFile) {
  const count = await prisma.populationPoint.count({
    where: {
      sourceFile: sourceFile
    }
  });
  return count > 0;
}

// Close the Prisma connection when done
export async function closeConnection() {
  await prisma.$disconnect();
}
