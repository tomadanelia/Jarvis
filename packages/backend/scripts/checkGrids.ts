import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
    console.error('Error: SUPABASE_URL is not defined in the .env file.');
    process.exit(1);
}
if (!supabaseKey) {
    console.error('Error: SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY if you switched) is not defined in the .env file.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
console.log('Attempting to connect to Supabase to check grids...');

/**
 * Checks the population of the 'grids' table in Supabase.
 * Logs the total number of grids and up to 5 grid names.
 * Handles errors for missing tables or connection issues.
 * @returns {Promise<void>}
 */
async function checkTablePopulation(): Promise<void> {
    try {
        const { count, error: countError } = await supabase
            .from('grids')
            .select('*', { count: 'exact', head: true });

        if (countError) {
            console.error('Error counting grids:', countError.message);
            if (countError.message.includes("relation \"public.grids\" does not exist")) {
                console.error("The 'grids' table might not have been created yet.");
            }
            return;
        }
        console.log(`Number of grids found in the table: ${count === null ? 0 : count}`);

        if (count !== null && count > 0) {
            console.log('\nFetching up to 5 grid names:');
            const { data: gridsData, error: fetchError } = await supabase
                .from('grids')
                .select('name')
                .limit(5);

            if (fetchError) {
                console.error('Error fetching grid names:', fetchError.message);
            } else if (gridsData && gridsData.length > 0) {
                gridsData.forEach(grid => console.log(`- ${grid.name}`));
            } else {
                console.log('Fetched data but it was empty (should not happen if count > 0).');
            }
        }

    } catch (error: any) {
        console.error('An unexpected error occurred:', error.message);
    }
}

checkTablePopulation()
    .then(() => {
        console.log('\nCheck script finished.');
        process.exit(0);
    })
    .catch((err) => {
        console.error('Unhandled error in checkTablePopulation:', err);
        process.exit(1);
    });