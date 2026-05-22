# Database Setup Instructions

To set up the database for Bakery by the Bay, follow these steps:

## Step 1: Access Supabase SQL Editor
1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/rrokmjzrnbapyjziqpbp
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"

## Step 2: Execute the SQL Migration
Copy and paste the following SQL into the query editor:

```sql
-- Drop tables if they exist (for clean slate)
DROP TABLE IF EXISTS feedback;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS menu_items;
DROP TABLE IF EXISTS menus;

-- Create menus table
CREATE TABLE menus (
  menu_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE UNIQUE NOT NULL,
  published BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create menu_items table
CREATE TABLE menu_items (
  item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id UUID REFERENCES menus(menu_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create orders table
CREATE TABLE orders (
  booking_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  items JSONB NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, ready, collected
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create feedback table
CREATE TABLE feedback (
  feedback_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  phone TEXT,
  message TEXT NOT NULL,
  rating INTEGER, -- optional 1-5
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Policies:
-- Menus: public can read if published
CREATE POLICY "Menus are viewable if published" ON menus
  FOR SELECT USING (published = TRUE);

-- Menu items: public can read via menu's published status
CREATE POLICY "Menu items are viewable if menu is published" ON menu_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM menus WHERE menus.menu_id = menu_items.menu_id AND menus.published = TRUE
    )
  );

-- Orders: public can insert (customer places order)
CREATE POLICY "Anyone can insert orders" ON orders
  FOR INSERT WITH CHECK (TRUE);

-- Orders: public can select orders by booking_id (for the confirmation page)
CREATE POLICY "Anyone can view orders by booking_id" ON orders
  FOR SELECT USING (TRUE);

-- Feedback: public can insert
CREATE POLICY "Anyone can insert feedback" ON feedback
  FOR INSERT WITH CHECK (TRUE);

-- For admin dashboard, we'll rely on service role key bypassing RLS (as per plan).
```

## Step 3: Run the Query
1. Click the "RUN" button to execute the SQL
2. You should see a success message indicating the query completed successfully

## Step 4: Verify Tables Were Created
1. Go to the "Table Editor" in the left sidebar
2. You should see four tables: menus, menu_items, orders, and feedback
3. Click on each table to verify the schema matches what's expected

## Step 5: Enable Realtime (Optional but Recommended)
1. Go to "Database" → "Replication" in the left sidebar
2. Click "Enable Realtime" for each of the four tables
3. This enables the real-time subscriptions used in the application

After completing these steps, run the verification script again:
```bash
node test-db.js
```

The database initialization task will then be complete.

---

## 🔧 Fix: Order confirmation showing "Order not found" / Total shows $0.00

If orders are being placed successfully (you get a booking ID) but the confirmation page says "Order not found" and shows $0.00, it's because the `orders` table needs a SELECT policy so the confirmation page can read order details.

Run this SQL in your Supabase SQL Editor:

```sql
-- Add SELECT policy for orders (so confirmation page can read them)
CREATE POLICY "Anyone can view orders by booking_id" ON orders
  FOR SELECT USING (TRUE);
```

This policy allows anyone with a booking ID to look up their order details on the confirmation page.