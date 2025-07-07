-- Migration to safely rename placed_franchises to placed_locations
-- This preserves existing data while updating the schema

-- Add new columns to placed_franchises first
ALTER TABLE "placed_franchises" ADD COLUMN IF NOT EXISTS "location_type" TEXT DEFAULT 'franchise';
ALTER TABLE "placed_franchises" ADD COLUMN IF NOT EXISTS "county" TEXT;
ALTER TABLE "placed_franchises" ADD COLUMN IF NOT EXISTS "state" TEXT;
ALTER TABLE "placed_franchises" ADD COLUMN IF NOT EXISTS "metro_area" TEXT;

-- Rename the table
ALTER TABLE "placed_franchises" RENAME TO "placed_locations";

-- Add any missing columns for the new schema
ALTER TABLE "games" ADD COLUMN IF NOT EXISTS "duration" INTEGER DEFAULT 30;
ALTER TABLE "games" ADD COLUMN IF NOT EXISTS "name" TEXT DEFAULT 'New Game';

-- Create enum types if they don't exist
DO $$ BEGIN
    CREATE TYPE "LocationType" AS ENUM ('franchise', 'distributionCenter');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "GameStatus" AS ENUM ('DRAFT', 'LIVE', 'FINISHED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add status column to games if it doesn't exist
ALTER TABLE "games" ADD COLUMN IF NOT EXISTS "status" "GameStatus" DEFAULT 'DRAFT';

-- Create population_points table if it doesn't exist
CREATE TABLE IF NOT EXISTS "population_points" (
    "id" SERIAL NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "population" INTEGER NOT NULL,

    CONSTRAINT "population_points_pkey" PRIMARY KEY ("id")
);

-- Create index on population_points
CREATE INDEX IF NOT EXISTS "population_points_latitude_longitude_idx" ON "population_points"("latitude", "longitude");