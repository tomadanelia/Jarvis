import { User } from '@supabase/supabase-js';

// Augment the Express Request interface to include a 'user' property.
// This allows us to safely attach the Supabase user object from the auth middleware.
declare global {
  namespace Express {
    export interface Request {
      user?: User;
    }
  }
}