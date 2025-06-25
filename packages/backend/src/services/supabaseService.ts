// packages/backend/src/services/supabaseService.ts
import { Cell, Robot, Task } from '@common/types'; // Assuming types.ts is accessible via this path alias
import { supabaseApiPublicClient } from '../config/supabaseClient';
import { createClient, SupabaseClient } from '@supabase/supabase-js';



/**
 * Represents the structure of a grid definition as fetched from the database.
 * The `layout` property is expected to be a fully processed 2D array of Cell objects.
 */
export interface GridDefinitionFromDB {
    id: string;
    name: string;
    layout: Cell[][];
}

/**
 * Represents a user's saved simulation setup from the database.
 */
export interface UserSetup {
    id: string;
    user_id: string;
    name: string;
    grid_id: string;
    robots: Robot[];
    tasks: Task[];
    strategy: string | null;
    created_at: string;
}


export class SupabaseService {
    /**
     * Creates a new Supabase client instance authenticated with a user's JWT.
     * This is safe for concurrent server-side requests as each call gets a new instance.
     * @param jwt The user's JSON Web Token.
     * @returns A SupabaseClient instance scoped to the user.
     */
    private createAuthenticatedClient(jwt: string): SupabaseClient {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error('Supabase URL or Anon Key is not configured.');
        }
        return createClient(supabaseUrl, supabaseAnonKey, {
            global: {
                headers: {
                    Authorization: `Bearer ${jwt}`
                }
            }
        });
    }

    /**
     * Fetches all grid definitions from the Supabase 'grids' table.
     * The layout is assumed to be pre-processed Cell[][].
     * @returns {Promise<GridDefinitionFromDB[]>} A promise that resolves to an array of grid definitions.
     * @throws Will throw an error if the Supabase query fails for reasons other than no data.
     */
    public async getGrids(): Promise<GridDefinitionFromDB[]> {
        console.log('SupabaseService: Attempting to fetch all grids...');
        const { data, error } = await supabaseApiPublicClient
            .from('grids')
            .select('id, name, layout'); // layout is already Cell[][]

        if (error) {
            console.error('SupabaseService: Error fetching grids:', error.message);
            // Depending on desired error handling, you might want to throw a custom error
            // or let the original Supabase error propagate.
            throw error;
        }

        console.log(`SupabaseService: Fetched ${data ? data.length : 0} grids.`);
        return data || []; // Ensure an array is always returned, even if data is null
    }

    /**
     * Fetches a single grid definition by its ID from the Supabase 'grids' table.
     * The layout is assumed to be pre-processed Cell[][].
     * @param {string} id - The UUID of the grid to fetch.
     * @returns {Promise<GridDefinitionFromDB | null>} A promise that resolves to the grid definition or null if not found.
     * @throws Will throw an error if the Supabase query fails for reasons other than 'PGRST116' (resource not found).
     */
    public async getGridById(id: string): Promise<GridDefinitionFromDB | null> {
        console.log(`SupabaseService: Attempting to fetch grid by ID: ${id}...`);
        const { data, error } = await supabaseApiPublicClient
            .from('grids')
            .select('id, name, layout') // layout is already Cell[][]
            .eq('id', id)
            .single(); // .single() expects exactly one row or zero, and errors otherwise.

        if (error) {
            // 'PGRST116' means "Requested range not satisfiable" - i.e., 0 rows returned by .single()
            // This is not an "error" in the sense of a failed query, but rather "not found".
            if (error.code === 'PGRST116') {
                console.log(`SupabaseService: Grid with ID ${id} not found.`);
                return null;
            }
            // For other errors, log and re-throw
            console.error(`SupabaseService: Error fetching grid by ID ${id}:`, error.message);
            throw error;
        }
        
        console.log(`SupabaseService: Grid with ID ${id} fetched successfully.`);
        return data; // data will be the single grid object or null if .single() found nothing (and error.code was PGRST116)
    }

    
  //saves final simulation results to the 'simulation_results' table.
  //called by SimulationEngineService when everything is done.

  

  public async saveSimulationResult(resultData: {
    gridId: string;
    gridName: string;
    strategy: string;
    totalTime: number;
    totalRecharges: number;
  }): Promise<void> {
    const { error } = await supabaseApiPublicClient
      .from('simulation_results')
      .insert([resultData]);
  
    if (error) {
      console.error('SupabaseService: Failed to save simulation result:', error.message);
      throw error;
    } else {
      console.log('SupabaseService: Simulation result saved successfully.');
    }
  }
  
  
    // --- User Setups ---

    /**
     * Fetches all setups for the user associated with the provided JWT.
     * RLS on the 'user_setups' table enforces that only the user's own setups are returned.
     * @param jwt The user's authentication token.
     * @returns A promise that resolves to an array of the user's setups.
     */
    public async getUserSetups(jwt: string): Promise<Omit<UserSetup, 'user_id'>[]> {
        const supabase = this.createAuthenticatedClient(jwt);
        const { data, error } = await supabase
            .from('user_setups')
            .select('id, name, grid_id, robots, tasks, strategy, created_at')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('SupabaseService: Error fetching user setups:', error.message);
            throw error;
        }
        return data || [];
    }

    /**
     * Fetches a single setup by its ID for the authenticated user.
     * @param jwt The user's authentication token.
     * @param setupId The ID of the setup to fetch.
     * @returns The setup object or null if not found.
     */
    public async getSetupById(jwt: string, setupId: string): Promise<UserSetup | null> {
        const supabase = this.createAuthenticatedClient(jwt);
        const { data, error } = await supabase
            .from('user_setups')
            .select('*')
            .eq('id', setupId)
            .single();

        if (error) {
            if (error.code !== 'PGRST116') { // Ignore "not found" errors
                console.error(`SupabaseService: Error fetching setup by ID ${setupId}:`, error.message);
                throw error;
            }
        }
        return data;
    }

    /**
     * Creates a new setup for a user.
     * @param jwt The user's authentication token.
     * @param userId The user's ID (must match the one in the JWT for RLS).
     * @param setupData The data for the new setup.
     * @returns The newly created setup object.
     */
    public async createSetup(jwt: string, userId: string, setupData: Pick<UserSetup, 'name' | 'grid_id' | 'robots' | 'tasks' | 'strategy'>): Promise<UserSetup> {
        const supabase = this.createAuthenticatedClient(jwt);
        const payload = { ...setupData, user_id: userId };
        const { data, error } = await supabase
            .from('user_setups')
            .insert(payload)
            .select()
            .single();

        if (error) {
            console.error('SupabaseService: Error creating setup:', error.message);
            throw error;
        }
        return data;
    }

    /**
     * Updates an existing setup for a user.
     * @param jwt The user's authentication token.
     * @param setupId The ID of the setup to update.
     * @param setupData The fields to update.
     * @returns The updated setup object.
     */
    public async updateSetup(jwt: string, setupId: string, setupData: Partial<Omit<UserSetup, 'id' | 'user_id' | 'created_at'>>): Promise<UserSetup | null> {
        const supabase = this.createAuthenticatedClient(jwt);
        const { data, error } = await supabase
            .from('user_setups')
            .update(setupData)
            .eq('id', setupId)
            .select()
            .single();

        if (error) {
            if (error.code !== 'PGRST116') { // Ignore "not found" during update
                console.error(`SupabaseService: Error updating setup ${setupId}:`, error.message);
                throw error;
            }
        }
        return data;
    }

    /**
     * Deletes a setup for a user.
     * @param jwt The user's authentication token.
     * @param setupId The ID of the setup to delete.
     * @returns The deleted setup object.
     */
    public async deleteSetup(jwt: string, setupId: string): Promise<UserSetup | null> {
        const supabase = this.createAuthenticatedClient(jwt);
        const { data, error } = await supabase
            .from('user_setups')
            .delete()
            .eq('id', setupId)
            .select()
            .single();
        
        if (error) {
             if (error.code !== 'PGRST116') { // Ignore "not found" during delete
                console.error(`SupabaseService: Error deleting setup ${setupId}:`, error.message);
                throw error;
            }
        }
        return data;
    }
  }

export const supabaseService = new SupabaseService();