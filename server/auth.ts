import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const SALT_ROUNDS = 12;

export interface User {
  id: string;
  username: string;
  email: string;
  password_hash?: string;
  created_at?: string;
  last_active?: string;
  highlight_color?: string;
  game_time?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export const authUtils = {
  hashPassword: async (password: string): Promise<string> => {
    return await bcrypt.hash(password, SALT_ROUNDS);
  },

  comparePassword: async (password: string, hash: string): Promise<boolean> => {
    return await bcrypt.compare(password, hash);
  },

  generateToken: (user: User): string => {
    return jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        email: user.email 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
  },

  verifyToken: (token: string): any => {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return null;
    }
  }
};

export const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = authUtils.verifyToken(token);
    
    if (!decoded) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    const { dbOperations } = await import('./database');
    const user = dbOperations.getUserById(decoded.id);
    
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const optionalAuthMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = authUtils.verifyToken(token);
      
      if (decoded) {
        const { dbOperations } = await import('./database');
        const user = dbOperations.getUserById(decoded.id);
        if (user) {
          req.user = user;
        }
      }
    }
    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next(); // Continue without authentication
  }
};