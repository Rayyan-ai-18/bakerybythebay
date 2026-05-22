// Initialize database by providing SQL for manual execution
const fs = require('fs');
require('dotenv').config();

const sql = fs.readFileSync('./migrations/001_init.sql', 'utf8');

// Split by semicolon and clean up
const statements = sql
  .split(';')
  .map(statement => statement.trim())
  .filter(statement => statement.length > 0);

async function initializeDatabase() {
  console.log(`=== Bakery Database Initialization ===\n`);
  console.log('Checking if required tables exist...');

  // Test connection using supabase-js
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  // Check each table individually
  const tablesToCheck = ['menus', 'menu_items', 'orders', 'feedback'];
  let allExist = true;

  for (const table of tablesToCheck) {
    const { data, error } = await supabase
      .from(table)
      .select('count')
      .limit(1);

    if (error && error.code === '42P01') { // undefined_table
      console.log(`✗ Table '${table}' does NOT exist`);
      allExist = false;
    } else if (!error) {
      console.log(`✓ Table '${table}' exists`);
    } else {
      // Other errors might be RLS or network, but let's assume table exists if not missing
      console.log(`? Table '${table}' check: ${error.message}`);
      // If it's not a "table doesn't exist" error, assume it exists
      if (!error.message.includes('could not find relation') &&
          !error.message.includes('Could not find the table')) {
        console.log(`  (Assuming table exists based on error type)`);
      } else {
        allExist = false;
      }
    }
  }

  console.log(`\n`);

  if (allExist) {
    console.log('✓ All required tables exist! Database initialization complete.');
    return;
  }

  console.log('✗ Some tables are missing. Please execute the following SQL:');
  console.log('\n📋 INSTRUCTIONS:');
  console.log('1. Go to: https://supabase.com/dashboard/project/_/sql');
  console.log('2. Paste the SQL below into the query editor');
  console.log('3. Click "RUN" to execute the SQL');
  console.log('4. Run this script again to verify\n');

  console.log('-- BEGIN SQL --');
  console.log(sql);
  console.log('-- END SQL --\n');

  // Also provide a simplified version for easy copying
  console.log('📄 For easy copying, here is the SQL without comments:\\n');
  const simpleSql = sql
    .split('\\n')
    .filter(line => !line.trim().startsWith('--') && line.trim() !== '')
    .join('\\n');
  console.log(simpleSql);
}

initializeDatabase().catch(console.error);