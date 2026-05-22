// Test script to check if we can connect to Supabase and if tables exist
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase URL or anon key in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('Testing connection to Supabase...');
  try {
    // Try to select from menus table (if it exists)
    const { data, error } = await supabase
      .from('menus')
      .select('count')
      .limit(1);

    if (error) {
      console.error('Error querying menus table:', error.message);
      // Check if it's because the table doesn't exist
      if (error.code === '42P01') { // undefined_table
        console.log('The menus table does not exist. Need to run migrations.');
      } else if (error.code === '42501') { // insufficient_privilege
        console.log('Insufficient privileges. Maybe RLS is blocking?');
      } else {
        console.log('Unexpected error:', error);
      }
    } else {
      console.log('Successfully queried menus table. Data:', data);
      console.log('Tables seem to exist.');
    }

    // Also try to insert a test order (should work if RLS allows)
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          booking_id: 'TEST-0000',
          name: 'Test User',
          phone: '1234567890',
          items: [{ name: 'Test Item', price: 1.0, quantity: 1 }],
          total: 1.0
        }
      ]);

    if (orderError) {
      console.error('Error inserting test order:', orderError.message);
    } else {
      console.log('Successfully inserted test order. Order data:', orderData);
      // Clean up: delete the test order
      await supabase
        .from('orders')
        .delete()
        .eq('booking_id', 'TEST-0000');
    }

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testConnection();