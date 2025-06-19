import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authUtils, authMiddleware, AuthenticatedRequest } from './auth';
import { dbOperations } from './database';

const router = express.Router();

// Signup endpoint
router.post('/signup', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body;

    // Validate input
    if (!username || !email || !password) {
      res.status(400).json({ error: 'Username, email, and password are required' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long' });
      return;
    }

    // Check if user already exists
    const existingUserByUsername = dbOperations.getUserByUsername(username);
    if (existingUserByUsername) {
      res.status(409).json({ error: 'Username already exists' });
      return;
    }

    const existingUserByEmail = dbOperations.getUserByEmail(email);
    if (existingUserByEmail) {
      res.status(409).json({ error: 'Email already exists' });
      return;
    }

    // Hash password and create user
    const passwordHash = await authUtils.hashPassword(password);
    const userId = uuidv4();

    const created = dbOperations.createUserWithAuth(userId, username, email, passwordHash);
    if (!created) {
      res.status(500).json({ error: 'Failed to create user' });
      return;
    }

    // Get the created user and generate token
    const user = dbOperations.getUserById(userId);
    const token = authUtils.generateToken(user);

    // Return user info (without password hash) and token
    const { password_hash, ...userInfo } = user;
    res.status(201).json({
      user: userInfo,
      token
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login endpoint
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }

    // Find user (can login with username or email)
    let user = dbOperations.getUserByUsername(username);
    if (!user) {
      user = dbOperations.getUserByEmail(username);
    }

    if (!user?.password_hash) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Check password
    const isValidPassword = await authUtils.comparePassword(password, user.password_hash);
    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Update last active
    dbOperations.updateUserActivity(user.id);

    // Generate token
    const token = authUtils.generateToken(user);

    // Return user info (without password hash) and token
    const { password_hash, ...userInfo } = user;
    res.json({
      user: userInfo,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user profile
router.get('/profile', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { password_hash, ...userInfo } = req.user!;
    res.json({ user: userInfo });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify token endpoint
router.get('/verify', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { password_hash, ...userInfo } = req.user!;
    res.json({
      valid: true,
      user: userInfo
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
