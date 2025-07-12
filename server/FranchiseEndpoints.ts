import express, { Request, Response } from 'express';
import { dbOperations } from './database.js';
import { getGeoDataFromCoordinates } from './metroAreaUtils';
import { getDistributionCost, getFranchiseCost } from './calculateCosts.js';
import { calculateIncomeForFranchise, calculateTotalIncomeForPlayer } from './incomeUtils.js';
import { Server } from 'socket.io';

export function setupFranchiseEndpoints(app: express.Application, io: Server) {

  app.get(
    '/api/games/:gameId/users/:userId/franchise-income',
    async (req: Request, res: Response): Promise<void> => {
      const { gameId, userId } = req.params;

      try {
        const franchises = await dbOperations.getUserGameFranchises(userId, gameId);

        const franchiseIncome = franchises.map(franchise => ({
          id: franchise.id,
          name: franchise.name,
          income: calculateIncomeForFranchise(franchise),
        }));

        const totalIncome = await calculateTotalIncomeForPlayer(userId, gameId);

        res.json({
          franchises: franchiseIncome,
          totalIncome,
        });
      } catch (error) {
        console.error('Error fetching franchise income:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  );

  app.post('/api/place-franchise', async (req: Request, res: Response): Promise<void> => {
    const { userId, gameId, lat, long, name, locationType = 'franchise', population } = req.body;
    if (!userId || !gameId || lat === undefined || long === undefined || !name) {
      res.status(400).json({ error: 'userId, gameId, lat, long, and name are required' });
      return;
    }

    if (typeof lat !== 'number' || typeof long !== 'number') {
      res.status(400).json({ error: 'lat and long must be numbers' });
      return;
    }

    try {
      const geoData = await getGeoDataFromCoordinates(lat, long);
      const { county, state, metroArea } = geoData || {};
      if (!geoData) {
        res.status(400).json({ error: 'Unable to determine location data for placement' });
        return;
      }

      let placementCost: number;
      if (locationType === 'distributionCenter') {
        // Get all existing locations for this game to check distribution centers
        const existingLocations = await dbOperations.getGameFranchises(gameId);
        const userDistributionCenters = existingLocations.filter(
          location => location.locationType === 'distribution-center' && location.userId === userId
        );
        placementCost = getDistributionCost(userDistributionCenters.length);
      } else {
        placementCost = await getFranchiseCost(lat, long).then(data => data.cost ?? 0);
      }

      // Check if user has enough money in this game
      const userMoney = await dbOperations.getUserGameMoney(userId, gameId);
      if (userMoney < placementCost) {
        res.status(400).json({ error: 'Insufficient funds to place location' });
        return;
      }

      // Deduct money and place location in a transaction-like manner (only if cost > 0)
      let moneyDeducted = true;
      if (placementCost > 0) {
        moneyDeducted = await dbOperations.deductUserGameMoney(userId, gameId, placementCost);
        if (!moneyDeducted) {
          res.status(400).json({ error: 'Failed to deduct money - insufficient funds' });
          return;
        }
      }

      // Validate franchise placement rules (only for franchises, not distribution centers)
      if (locationType === 'franchise') {
        try {
          // Get all existing locations for this game
          const existingLocations = await dbOperations.getGameFranchises(gameId);

          // Check distribution center requirement (500-mile rule)
          const userDistributionCenters = existingLocations.filter(
            location => location.locationType === 'distribution-center' && location.userId === userId
          );

          if (userDistributionCenters.length === 0) {
            res
              .status(400)
              .json({ error: 'Must build a distribution center before placing franchises' });
            return;
          }
        } catch (validationError) {
          console.error('❌ Validation error:', validationError);
          res.status(500).json({ error: 'Failed to validate franchise placement' });
          return;
        }
      }

      let franchise;
      try {
        franchise = await dbOperations.placeFranchise(
          userId,
          gameId,
          lat,
          long,
          name,
          county,
          state,
          metroArea,
          locationType,
          population
        );
      } catch (error) {
        console.error('❌ Error in placeFranchise:', error);
        // If location placement failed, refund the money (only if money was deducted)
        if (placementCost > 0) {
          const currentMoney = await dbOperations.getUserGameMoney(userId, gameId);
          await dbOperations.updateUserGameMoney(userId, gameId, currentMoney + placementCost);
        }
        res.status(500).json({ error: 'Database error: ' + (error as Error).message });
        return;
      }

      if (!franchise) {
        // If location placement failed, refund the money (only if money was deducted)
        if (placementCost > 0) {
          const currentMoney = await dbOperations.getUserGameMoney(userId, gameId);
          await dbOperations.updateUserGameMoney(userId, gameId, currentMoney + placementCost);
        }
        res.status(500).json({ error: 'Failed to place location' });
        return;
      }

      // Get the updated money amount after franchise placement
      const remainingMoney = await dbOperations.getUserGameMoney(userId, gameId);

      io.of('/game').to(`game-${gameId}`).emit('location-added', franchise);

      // Emit money update to the specific user via socket
      const userSockets = Array.from(io.sockets.sockets.values()).filter(
        socket => socket.userId === userId && socket.gameId === gameId
      );

      userSockets.forEach(socket => {
        socket.emit('money-update', { userId, newMoney: remainingMoney });
        console.log(`Emitted money update to user ${userId}: $${remainingMoney}`);
      });

      res.json({
        message: 'Location placed successfully',
        cost: placementCost,
        remainingMoney,
      });
    } catch (error) {
      console.error('Error placing franchise:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get all franchises for a game
  app.get('/api/games/:gameId/franchises', async (req: Request, res: Response): Promise<void> => {
    const { gameId } = req.params;

    try {
      const franchises = await dbOperations.getGameFranchises(gameId);

      // Backfill location data for franchises that don't have it
      for (const franchise of franchises) {
        if (!franchise.county && !franchise.state && !franchise.metroArea) {
          try {
            const geoData = await getGeoDataFromCoordinates(franchise.lat, franchise.long);
            if (geoData) {
              const updated = await dbOperations.updateFranchiseLocation(
                parseInt(franchise.id),
                geoData.county || undefined,
                geoData.state || undefined,
                geoData.metroArea || undefined
              );
              if (updated) {
                // Update the franchise object for this response
                franchise.county = geoData.county;
                franchise.state = geoData.state;
                franchise.metroArea = geoData.metroArea;
              }
            }
          } catch (error) {
            console.error(`Failed to backfill location for franchise ${franchise.id}:`, error);
          }
        }
      }

      res.json({ franchises });
    } catch (error) {
      console.error('Error fetching game franchises:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Delete franchise
  app.delete('/api/franchises/:franchiseId', async (req: Request, res: Response): Promise<void> => {
    const { franchiseId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }

    try {
      const success = await dbOperations.removeFranchise(franchiseId, userId);

      if (success) {
        res.json({ message: 'Franchise removed successfully' });
      } else {
        res.status(404).json({ error: 'Franchise not found or not owned by user' });
      }
    } catch (error) {
      console.error('Error removing franchise:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get franchise information by ID
  app.get('/api/franchises/:franchiseId', async (req: Request, res: Response): Promise<void> => {
    const { franchiseId } = req.params;

    if (!franchiseId) {
      res.status(400).json({ error: 'franchiseId is required' });
      return;
    }

    try {
      const franchise = await dbOperations.getFranchiseById(franchiseId);

      if (franchise) {
        // Calculate income for this franchise
        const income = calculateIncomeForFranchise(franchise);
        
        res.json({
          ...franchise,
          income
        });
      } else {
        res.status(404).json({ error: 'Franchise not found' });
      }
    } catch (error) {
      console.error('Error fetching franchise:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

}
