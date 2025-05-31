import { createClient, SupabaseClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import { Cell, CellType, Coordinates } from '../../common/src/types';
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl) {
    console.error('Error: SUPABASE_URL is not defined in the .env file.');
    process.exit(1); 
}
if (!supabaseServiceRoleKey) {
    console.error('Error: SUPABASE_SERVICE_ROLE_KEY is not defined in the .env file.');
    console.error('This key is required for the seeding script to bypass RLS for inserts/upserts.');
    console.error('You can find it in your Supabase project settings under API -> Project API keys.');
    process.exit(1);
}
const supabaseAdminClient: SupabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
});
console.log('Supabase Admin Client initialized for seeding.');
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
 * Reads a grid layout from a text file, parses it, maps to correct type of grid  layout as definedinserts it into the Supabase database.
 *
 * @param {string} filePath - The path to the text file containing the grid layout.
 * @param {string} gridName - The name of the grid (used for database insertion).
 */async function seedDatabase() {
const gridDefinitionsDir = path.resolve(__dirname, './grid_definitions/text_files'); // MODIFIED path
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
        process.exit(1); 
    }

    console.log('\nGrid seeding finished.');
}
if (require.main === module) {
    seedDatabase()
        .then(() => {
            console.log("Seeding script completed successfully.");
            // process.exit(0); // Avoid process.exit in testable modules
        })
        .catch(err => {
            console.error("Unhandled error during top-level execution of seeding script:", err);
            // process.exit(1); // Avoid process.exit
        });
}

