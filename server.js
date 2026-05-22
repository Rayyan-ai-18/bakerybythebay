const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json({ limit: '10mb' })); // for base64 image uploads

// Supabase clients
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey); // service role bypasses RLS
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey); // anon key for client-side

// Serve static files
app.use(express.static(path.join(__dirname)));

// Helper: generate booking ID BKR-DDMM-XXXX
function generateBookingId() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BKR-${day}${month}-${random}`;
}

// Log API key status (masked) for debugging
console.log('OpenRouter API Key:', process.env.OPENROUTER_API_KEY ?
  `${process.env.OPENROUTER_API_KEY.substring(0, 10)}...` : 'Not set');

// POST /api/scan-menu
app.post('/api/scan-menu', async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // Try models in fallback order - using known free/low-cost vision models
    const models = [
      'qwen/qwen3-vl-8b-instruct',
      'qwen/qwen3-vl-32b-instruct',
      'nvidia/nemotron-nano-12b-v2-vl:free'
    ];

    let lastError = null;
    for (const model of models) {
      try {
        console.log(`Trying model: ${model}`);
        const openrouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: model,
            messages: [{
              role: 'user',
              content: [{
                type: 'text',
                text: 'You are an expert at reading bakery menus. Extract all items from this menu image. For each item, provide: name, price (as number), category. Respond ONLY with a JSON array of objects. Example: [{"name": "Croissant", "price": 3.50, "category": "Pastry"}]. If price is unclear, estimate reasonably. Categories: Bread, Pastry, Cake, Coffee, Tea, Sandwich, etc.'
              }, {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }]
            }],
            max_tokens: 1000
          })
        });

        console.log(`OpenRouter response status: ${openrouterResponse.status}`);

        if (!openrouterResponse.ok) {
          const errorText = await openrouterResponse.text();
          throw new Error(`OpenRouter API error: ${openrouterResponse.status} - ${errorText}`);
        }

        const data = await openrouterResponse.json();
        console.log('OpenRouter full response:', JSON.stringify(data, null, 2));
        // Check if OpenRouter returned an error in the response body
        if (data.error) {
          throw new Error(`OpenRouter API error: ${data.error.message || 'unknown'}`);
        }
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid response from OpenRouter: not an object');
        }
        if (!data.choices || !Array.isArray(data.choices)) {
          throw new Error('Invalid response from OpenRouter: no choices array');
        }
        if (data.choices.length === 0) {
          throw new Error('Invalid response from OpenRouter: empty choices array');
        }
        const content = data.choices[0].message?.content;
        if (typeof content !== 'string') {
          throw new Error('Invalid response from OpenRouter: missing or invalid content');
        }

        // Extract JSON from response (handle possible markdown formatting)
        let jsonStr = content.trim();
        if (jsonStr.startsWith('```json')) {
          jsonStr = jsonStr.slice(7, -3).trim();
        } else if (jsonStr.startsWith('```')) {
          jsonStr = jsonStr.slice(3, -3).trim();
        }

        const items = JSON.parse(jsonStr);

        // Validate items structure
        if (!Array.isArray(items)) {
          throw new Error('Response is not an array');
        }

        // Ensure each item has required fields
        const validatedItems = items.map(item => ({
          name: String(item.name || '').trim(),
          price: Number(item.price) || 0,
          category: String(item.category || 'Other').trim(),
          available: true
        })).filter(item => item.name && !isNaN(item.price));

        // Return the validated items (may be empty if no valid items found)
        res.json(validatedItems);
        return;
      } catch (error) {
        lastError = error;
        console.warn(`Model ${model} failed:`, error.message);
        continue; // try next model
      }
    }

    // All models failed
    res.status(500).json({ error: 'All vision models failed', details: lastError.message });
  } catch (error) {
    console.error('Scan menu error:', error);
    res.status(500).json({ error: 'Failed to scan menu', details: error.message });
  }
});

// POST /api/publish-menu
app.post('/api/publish-menu', async (req, res) => {
  try {
    const { menuId, date, items } = req.body;

    if (!date || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Resolve the effective menu_id
    let effectiveMenuId = menuId;

    if (!effectiveMenuId) {
      // Look up existing menu for this date first
      const { data: existingMenu } = await supabaseAdmin
        .from('menus')
        .select('menu_id')
        .eq('date', date)
        .maybeSingle();

      if (existingMenu) {
        effectiveMenuId = existingMenu.menu_id;
        // Update existing menu to published
        const { error: updateError } = await supabaseAdmin
          .from('menus')
          .update({ published: true })
          .eq('menu_id', effectiveMenuId);
        if (updateError) throw updateError;
      } else {
        // Create new menu (DB auto-generates UUID via DEFAULT gen_random_uuid())
        const { data: newMenu, error: createError } = await supabaseAdmin
          .from('menus')
          .insert({ date, published: true })
          .select('menu_id')
          .single();
        if (createError) throw createError;
        effectiveMenuId = newMenu.menu_id;
      }
    } else {
      // menuId was provided — just set it to published
      const { error: updateError } = await supabaseAdmin
        .from('menus')
        .update({ published: true })
        .eq('menu_id', effectiveMenuId);
      if (updateError) throw updateError;
    }

    // Delete existing items for this menu
    const { error: deleteError } = await supabaseAdmin
      .from('menu_items')
      .delete()
      .eq('menu_id', effectiveMenuId);

    if (deleteError) throw deleteError;

    // Insert new items
    const menuItemsToInsert = items.map(item => ({
      menu_id: effectiveMenuId,
      name: item.name,
      price: item.price,
      category: item.category,
      available: item.available !== undefined ? item.available : true
    }));

    const { error: insertError } = await supabaseAdmin
      .from('menu_items')
      .insert(menuItemsToInsert);

    if (insertError) throw insertError;

    res.json({ success: true });
  } catch (error) {
    console.error('Publish menu error:', error);
    res.status(500).json({ error: 'Failed to publish menu', details: error.message });
  }
});

// POST /api/update-order-status
app.post('/api/update-order-status', async (req, res) => {
  try {
    const { bookingId, status } = req.body;

    if (!bookingId || !status) {
      return res.status(400).json({ error: 'Missing bookingId or status' });
    }

    const validStatuses = ['pending', 'ready', 'collected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const { error } = await supabaseAdmin
      .from('orders')
      .update({ status: status })
      .eq('booking_id', bookingId);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order status', details: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n  🥐 Bakery by the Bay - API Server\n`);
  console.log(`  → http://localhost:${PORT}/\n`);
  console.log(`  Endpoints: /api/scan-menu, /api/publish-menu, /api/update-order-status, /api/health\n`);
  console.log(`  Serving static files from ${__dirname}\n`);
});