import { Request, Response } from 'express';
import { supabaseApiPublicClient } from '../config/supabaseClient';

/**
 * Handles user signup.
 * Expects 'email' and 'password' in the request body.
 * Creates a new user in Supabase Auth.
 * @param req Express request object.
 * @param res Express response object.
 */
export const signupUser = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  try {
    const { data, error } = await supabaseApiPublicClient.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error('Supabase signup error:', error.message);
      // This correctly sends a 400 status with a JSON error object.
      res.status(400).json({ error: error.message });
      return;
    }
    
    // On success, send a 201 status with the Supabase data object.
    res.status(201).json(data);
    
  } catch (err: any) {
    console.error('Unexpected error during signup:', err.message);
    res.status(500).json({ error: 'Internal server error during signup.' });
  }
};

/**
 * Handles user login.
 * Expects 'email' and 'password' in the request body.
 * Signs in the user and returns a session with a JWT.
 * @param req Express request object.
 * @param res Express response object.
 */
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  try {
    const { data, error } = await supabaseApiPublicClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Supabase login error:', error.message);
      // This correctly sends a 401 status for bad credentials.
      res.status(401).json({ error: error.message });
      return;
    }

    // On success, send a 200 status with the session data.
    res.status(200).json(data);
  } catch (err: any) {
    console.error('Unexpected error during login:', err.message);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
};