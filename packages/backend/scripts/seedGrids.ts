import { createClient, SupabaseClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import { Cell, CellType, Coordinates } from '../../common/src/types';

// Load environment variables. This is fine at the top level,
// but functions using these variables should handle their potential absence if called from tests
// or throw errors that can be caught rather than calling process.exit.
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

/**
 * Parses a string representation of a character matrix into a 2D array of Cell objects.
 *
 * @param {string} matrixString - The textfile containing the grid layout, with rows separated by newlines.
 * @param {string} gridName - The name of the grid (used for warning messages).
 * @returns {Cell[][]} A 2D array representing the grid, where each element is a Cell object.
 *
 * The function interprets the following characters:
 * - '.' as 'walkable'
 * - '#' as 'wall'
 * - 'c' as 'chargingStation'
 * - '_' or undefined as 'empty'
 * Any unknown character defaults to 'wall' and triggers a warning.
**/
export function parseCharacterMatrix(matrixString: string, gridName: string): Cell[][] {
     const trimmedMatrix = matrixString.trim();
    if (!trimmedMatrix) { 
        return [];
    }
    const layout: Cell[][] = [];
    const rows = matrixString.trim().split('\n').map(row => row.trim());

    let maxWidth = 0;
    for (const row of rows) {
        if (row.length > maxWidth) {
            maxWidth = row.length;
        }
    }

    for (let y = 0; y < rows.length; y++) {
        const rowString = rows[y];
        const rowCells: Cell[] = [];
        for (let x = 0; x < maxWidth; x++) {
            const char = rowString[x];
            let cellType: CellType;
            switch (char) {
                case '.': cellType = 'walkable'; break;
                case '#': cellType = 'wall'; break;
                case 'c': cellType = 'chargingStation'; break;
                case '_': cellType = 'empty'; break;
                case undefined: cellType = 'empty'; break;
                default:
                    console.warn(`Grid '${gridName}': Unknown character '${char}' at (${x},${y}), defaulting to wall.`);
                    cellType = 'wall';
            }
            rowCells.push({ type: cellType, coordinates: { x, y } });
        }
        layout.push(rowCells);
    }
    return layout;
}

/**
 * Reads grid layouts from text files, parses them, and inserts/upserts them into the Supabase database.
 * This function now contains the Supabase client initialization and environment variable checks,
 * and will throw errors instead of calling process.exit directly.
 */
async function seedDatabase() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
        const errorMsg = 'Error: SUPABASE_URL is not defined in the .env file for seedDatabase.';
        console.error(errorMsg);
        throw new Error(errorMsg);
    }
    if (!supabaseServiceRoleKey) {
        const errorMsg = 'Error: SUPABASE_SERVICE_ROLE_KEY is not defined in the .env file for seedDatabase.';
        console.error(errorMsg);
        console.error('This key is required for the seeding script to bypass RLS for inserts/upserts.');
        console.error('You can find it in your Supabase project settings under API -> Project API keys.');
        throw new Error(errorMsg);
    }

    // Initialize client inside the function that needs it
    const supabaseAdminClient: SupabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey);
    console.log('Supabase Admin Client initialized for seeding process.');

    const gridDefinitionsDir = path.resolve(__dirname, './grid_definitions/text_files');
    console.log('Looking for grid definition files in:', gridDefinitionsDir);

    try {
        const files = await fs.readdir(gridDefinitionsDir);
        const txtFiles = files.filter(file => file.endsWith('.txt') && !file.startsWith('example_'));

        if (txtFiles.length === 0) {
            console.warn(`No suitable .txt files found in ${gridDefinitionsDir}. Nothing to seed.`);
            return; 
        }
        console.log(`Found ${txtFiles.length} grid definition file(s):`, txtFiles.join(', '));

        for (const fileName of txtFiles) {
            const gridName = fileName
                .replace('.txt', '')
                .replace(/[-_]/g, ' ') 
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');

            console.log(`\nProcessing grid: "${gridName}" (from ${fileName})`);
            const filePath = path.join(gridDefinitionsDir, fileName);

            try {
                const compactLayoutStringFromFile = await fs.readFile(filePath, 'utf-8');
                if (!compactLayoutStringFromFile.trim()) {
                    console.warn(`File ${fileName} is empty or contains only whitespace. Skipping.`);
                    continue; 
                }
                const fullLayout = parseCharacterMatrix(compactLayoutStringFromFile, gridName);

                if (fullLayout.length === 0 || fullLayout.every(row => row.length === 0)) {
                    console.warn(`Parsed layout for "${gridName}" is empty. Skipping database insert.`);
                    continue;
                }

                console.log(`  Attempting to upsert "${gridName}" into Supabase...`);
                const { data, error: upsertError } = await supabaseAdminClient
                    .from('grids')
                    .upsert({ name: gridName, layout: fullLayout }, { onConflict: 'name' })
                    .select(); 

                if (upsertError) {
                    console.error(`  Error seeding grid "${gridName}" into Supabase:`, upsertError.message);
                } else {
                    console.log(`  Grid "${gridName}" seeded successfully.`);
                }
            } catch (fileProcessingError: any) {
                console.error(`  Error reading or parsing file ${fileName}:`, fileProcessingError.message);
            }
        }
    } catch (err: any) {
        if (err.code === 'ENOENT') {
            console.error(`Error: Grid definitions directory not found at ${gridDefinitionsDir}. Please create it and add your .txt grid files.`);
        } else {
            console.error("Error reading grid definition directory or during seeding:", err);
        }
        throw err; // Re-throw error to be caught by the main execution block
    }
    console.log('\nGrid seeding finished.');
}

// This block ensures that seedDatabase() and process.exit calls
// only happen when the script is run directly (e.g., `ts-node seedGrids.ts`),
// not when it's imported by another module (like a test file).
if (require.main === module) {
    console.log('seedGrids.ts is being run directly.');
    seedDatabase()
        .then(() => {
            console.log("Seeding script completed successfully from direct execution.");
            process.exit(0); // Successful exit
        })
        .catch(err => {
            // Log the actual error message if available
            const errorMessage = err instanceof Error ? err.message : String(err);
            console.error("Unhandled error during top-level execution of seeding script:", errorMessage);
            process.exit(1); // Error exit
        });
}