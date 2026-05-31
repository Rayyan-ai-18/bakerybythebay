// Seed the constant menu with all bakery products
// Works with existing schema (no 'type' column needed)

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Comprehensive list of all bakery products for the constant menu
const products = [
  // === Pastry ===
  { name: 'Classic Butter Croissant', price: 4.50, category: 'Pastry' },
  { name: 'Almond Croissant', price: 5.75, category: 'Pastry' },
  { name: 'Chocolate Croissant', price: 4.00, category: 'Pastry' },
  { name: 'Cinnamon Bun', price: 5.50, category: 'Pastry' },
  { name: 'Butter Tart', price: 3.75, category: 'Pastry' },
  { name: 'Apple Turnover', price: 4.75, category: 'Pastry' },
  { name: 'Cheddar & Herb Scone', price: 4.25, category: 'Pastry' },
  { name: 'Scone (Plain)', price: 5.25, category: 'Pastry' },
  { name: 'Croissant', price: 3.50, category: 'Pastry' },
  { name: 'Cinnamon Bun (Large)', price: 8.75, category: 'Pastry' },
  { name: 'Square (Assorted)', price: 4.50, category: 'Pastry' },
  { name: 'Cupcake', price: 4.50, category: 'Pastry' },
  { name: 'Fruit / Cream Tart', price: 5.00, category: 'Pastry' },
  
  // === Bread ===
  { name: 'Sourdough Loaf', price: 7.00, category: 'Bread' },
  
  // === Cookie ===
  { name: 'Chocolate Chip Cookie', price: 3.00, category: 'Cookie' },
  { name: 'Oatmeal Raisin Cookie', price: 3.00, category: 'Cookie' },
  { name: 'Assorted Cookies (6-pack)', price: 5.00, category: 'Cookie' },
  
  // === Muffin ===
  { name: 'Blueberry Muffin', price: 4.00, category: 'Muffin' },
  { name: 'Muffin (Assorted)', price: 4.00, category: 'Muffin' },
  
  // === Cake ===
  { name: 'Mini Cheesecake', price: 5.00, category: 'Cake' },
  
  // === Pie ===
  { name: 'Fruit Pie (Whole)', price: 25.00, category: 'Pie' },
  { name: 'Pecan Pie (Whole)', price: 30.00, category: 'Pie' },
  { name: 'Cream Pie (Whole)', price: 30.00, category: 'Pie' },
  
  // === Coffee ===
  { name: 'Latte', price: 4.00, category: 'Coffee' },
  { name: 'Amara Coffee', price: 3.50, category: 'Coffee' },
];

async function seed() {
  console.log('=== Seeding Constant Menu ===\n');

  // Use a sentinel date to identify the constant menu (since 'type' column doesn't exist)
  const CONSTANT_MENU_DATE = '1970-01-01';
  
  // Check if constant menu already exists
  const { data: existing, error: queryError } = await supabase
    .from('menus')
    .select('menu_id')
    .eq('date', CONSTANT_MENU_DATE)
    .limit(1);

  let constantMenuId;
  
  if (!queryError && existing && existing.length > 0) {
    constantMenuId = existing[0].menu_id;
    console.log(`✅ Constant menu already exists (ID: ${constantMenuId})`);
  } else {
    // Create new constant menu with sentinel date
    const { data: newMenu, error: createError } = await supabase
      .from('menus')
      .insert({ date: CONSTANT_MENU_DATE, published: true })
      .select('menu_id')
      .single();

    if (createError) {
      console.error('❌ Failed to create constant menu:', createError.message);
      process.exit(1);
    }
    
    constantMenuId = newMenu.menu_id;
    console.log(`✅ Constant menu created (ID: ${constantMenuId})`);
  }

  // Delete existing items for this constant menu
  const { error: deleteError } = await supabase
    .from('menu_items')
    .delete()
    .eq('menu_id', constantMenuId);

  if (deleteError) {
    console.error('❌ Failed to delete existing items:', deleteError.message);
    process.exit(1);
  }
  console.log('   Existing items deleted');

  // Insert all products
  const itemsToInsert = products.map(p => ({
    menu_id: constantMenuId,
    name: p.name,
    price: p.price,
    category: p.category,
    available: true
  }));

  const { error: insertError } = await supabase
    .from('menu_items')
    .insert(itemsToInsert);

  if (insertError) {
    console.error('❌ Failed to insert items:', insertError.message);
    process.exit(1);
  }
  console.log(`✅ ${products.length} products seeded!`);

  // Verify
  const { data: verifyItems } = await supabase
    .from('menu_items')
    .select('item_id, name, price, category')
    .eq('menu_id', constantMenuId)
    .order('category');

  if (verifyItems) {
    console.log(`\n📋 Verification: ${verifyItems.length} items in constant menu`);
    const byCategory = {};
    for (const item of verifyItems) {
      if (!byCategory[item.category]) byCategory[item.category] = [];
      byCategory[item.category].push(`${item.name} ($${parseFloat(item.price).toFixed(2)})`);
    }
    for (const [cat, items] of Object.entries(byCategory)) {
      console.log(`\n  ${cat}:`);
      items.forEach(i => console.log(`    • ${i}`));
    }
  }

  // Output the constant menu ID for use in the code
  console.log(`\n📌 Constant Menu ID: ${constantMenuId}`);
  console.log('   Use this ID in the code to reference the constant menu.');
}

seed().catch(console.error);
