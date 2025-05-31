// packages/backend/src/config/supabaseClient.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Ensure .env is loaded from the correct path.
// This path is relative to the 'dist/config' directory after compilation,
// or 'src/config' during development with ts-node.
// It assumes the .env file is at the root of the 'packages/backend' directory.
// When 'dist/config/supabaseClient.js' runs, __dirname is 'dist/config', so '../../.env' points to 'packages/backend/.env'.
// When 'src/config/supabaseClient.ts' runs with ts-node, __dirname is 'src/config', so '../../.env' points to 'packages/backend/.env'.
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY; // Use ANON key for public API

if (!supabaseUrl) {
    console.error('Error: SUPABASE_URL is not defined in the .env file.');
    // Consider whether to throw an error or allow the app to start in a degraded state
    // For critical services like Supabase, throwing an error is often appropriate.
    throw new Error('Supabase URL is missing in .env file for API client. Backend cannot start without it.');
}

if (!supabaseAnonKey) {
    console.error('Error: SUPABASE_ANON_KEY is not defined in the .env file.');
    throw new Error('Supabase Anon Key is missing in .env file for API client. Backend cannot start without it.');
}

export const supabaseApiPublicClient: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

console.log('Supabase API Public Client initialized (using ANON key).');