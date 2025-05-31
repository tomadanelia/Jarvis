// packages/backend/src/services/supabaseService.ts
import { Cell } from '@common/types'; // Assuming types.ts is accessible via this path alias
import { supabaseApiPublicClient } from '../config/supabaseClient';

/**
 * Represents the structure of a grid definition as fetched from the database.
 * The `layout` property is expected to be a fully processed 2D array of Cell objects.
 */
export interface GridDefinitionFromDB {
    id: string;
    name: string;
    layout: Cell[][];
}

export class SupabaseService {
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
}