import { Request, Response, NextFunction } from 'express';
import { supabaseApiPublicClient } from '../config/supabaseClient';

/**
 * Middleware to verify Supabase JWT.
 * If the token is valid, it attaches the user object to the request.
 * Otherwise, it sends a 401 Unauthorized response.
 * @param req Express request object.
 * @param res Express response object.
 * @param next Express next function.
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: No token provided.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Unauthorized: Malformed token.' });
    return;
  }

  try {
    const { data: { user }, error } = await supabaseApiPublicClient.auth.getUser(token);

    if (error || !user) {
      console.warn('JWT validation error:', error?.message);
      res.status(401).json({ error: 'Unauthorized: Invalid token.' });
      return;
    }

    // Attach user to the request object for use in subsequent handlers
    req.user = user;
    next();
  } catch (err) {
    console.error('Unexpected error in auth middleware:', err);
    res.status(500).json({ error: 'Internal server error.' });
    return;
  }
};