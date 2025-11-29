const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createNoticeTable() {
    console.log('Checking for "notices" table...');
    // Supabase doesn't have a direct table check via JS SDK, we'll rely on the insert logic
    // This is a simplified setup. A proper migration tool would be better for production.

    try {
        // Create table if it doesn't exist. 
        // This is a bit of a hack. Supabase management should be done via SQL migrations in the Supabase UI.
        // We are doing it here for simplicity of the project.
        // The user should be advised to run this script once.
        
        // Let's check if we can get data. If it fails, maybe the table doesn't exist.
        const { data, error } = await supabase.from('notices').select('*');

        if (error && error.code === '42P01') { // '42P01' is 'undefined_table' in PostgreSQL
            console.log('"notices" table not found. This script cannot create it.');
            console.log('Please create the table in your Supabase dashboard with columns: id (int8, primary key) and content (text).');
            console.log('Then, add one row with some default notice content.');
        } else if (!data || data.length === 0) {
            console.log('"notices" table is empty. Inserting a default notice.');
            const { error: insertError } = await supabase
                .from('notices')
                .insert({ content: 'Welcome to Milky Way! We are now open for orders.' });

            if (insertError) {
                console.error('Error inserting default notice:', insertError);
            } else {
                console.log('Default notice inserted successfully.');
            }
        } else {
            console.log('"notices" table already exists and has content.');
        }
    } catch (e) {
        console.error('An error occurred:', e.message);
        console.log('Please ensure your Supabase credentials are correct in the .env file.');
    }
}

createNoticeTable();
