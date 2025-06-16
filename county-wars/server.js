import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5183", // Vite dev server
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Store user county ownership data (in production, use a database)
const userCounties = new Map(); // userId -> Set of county names
const userSessions = new Map(); // socketId -> userId

// Simple file-based persistence (replace with database in production)
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'user-counties.json');

// Load existing data on server start
function loadUserData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      for (const [userId, counties] of Object.entries(data)) {
        userCounties.set(userId, new Set(counties));
      }
      console.log('Loaded user data from file');
    }
  } catch (error) {
    console.error('Error loading user data:', error);
  }
}

// Save data to file
function saveUserData() {
  try {
    const data = {};
    for (const [userId, counties] of userCounties) {
      data[userId] = Array.from(counties);
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving user data:', error);
  }
}

// Load data on startup
loadUserData();

// Authentication middleware for socket connections
io.use((socket, next) => {
  const userId = socket.handshake.auth.userId;
  if (!userId) {
    return next(new Error('Authentication error'));
  }
  socket.userId = userId;
  next();
});

io.on('connection', (socket) => {
  console.log(`User ${socket.userId} connected`);

  // Register user session
  userSessions.set(socket.id, socket.userId);
  // Initialize user's counties if they don't exist
  if (!userCounties.has(socket.userId)) {
    userCounties.set(socket.userId, new Set());
  }

  // Send current owned counties to the user
  socket.emit('counties-update', {
    ownedCounties: Array.from(userCounties.get(socket.userId) || [])
  });

  // Handle county ownership changes
  socket.on('claim-county', (data) => {
    const { countyName } = data;
    const userId = socket.userId;

    if (!countyName) {
      socket.emit('error', { message: 'County name is required' });
      return;
    }

    // Check if county is already owned by another user
    let isOwned = false;
    for (const [otherUserId, counties] of userCounties) {
      if (otherUserId !== userId && counties.has(countyName)) {
        isOwned = true;
        break;
      }
    }

    if (isOwned) {
      socket.emit('error', { message: 'County is already owned by another player' });
      return;
    }

    // Claim the county
    userCounties.get(userId).add(countyName);

    // Save data to file
    saveUserData();

    // Notify the user
    socket.emit('county-claimed', { countyName });

    // Broadcast to all other users that this county is now taken
    socket.broadcast.emit('county-taken', { countyName, userId });

    console.log(`User ${userId} claimed county: ${countyName}`);
  });

  // Handle county release
  socket.on('release-county', (data) => {
    const { countyName } = data;
    const userId = socket.userId;

    if (!countyName) {
      socket.emit('error', { message: 'County name is required' });
      return;
    }

    const userCountySet = userCounties.get(userId);
    if (userCountySet && userCountySet.has(countyName)) {
      userCountySet.delete(countyName);

      // Save data to file
      saveUserData();

      // Notify the user
      socket.emit('county-released', { countyName });

      // Broadcast to all other users that this county is now available
      socket.broadcast.emit('county-available', { countyName });

      console.log(`User ${userId} released county: ${countyName}`);
    } else {
      socket.emit('error', { message: 'You do not own this county' });
    }
  });

  // Get all owned counties for a user
  socket.on('get-owned-counties', () => {
    const userId = socket.userId;
    const ownedCounties = Array.from(userCounties.get(userId) || []);
    socket.emit('owned-counties', { ownedCounties });
  });

  // Get all taken counties (for display purposes)
  socket.on('get-all-taken-counties', () => {
    const allTakenCounties = {};
    for (const [userId, counties] of userCounties) {
      for (const county of counties) {
        allTakenCounties[county] = userId;
      }
    }
    socket.emit('all-taken-counties', allTakenCounties);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User ${socket.userId} disconnected`);
    userSessions.delete(socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
