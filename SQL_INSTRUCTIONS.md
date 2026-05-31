# Database Setup Instructions

To set up the database for Bakery by the Bay, follow these steps:

## Step 1: Access Supabase SQL Editor
1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/rrokmjzrnbapyjziqpbp
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"

## Step 2: Execute the SQL Migration

Copy and paste the SQL below into the Supabase SQL Editor and click RUN.

```sql
-- Drop tables if they exist (for clean slate)
DROP TABLE IF EXISTS feedback;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS menu_items;
DROP TABLE IF EXISTS menus;

-- Create menus table
CREATE TABLE menus (
  menu_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'daily_lunch', -- 'daily_lunch' or 'constant'
  date DATE, -- NULL for constant menu, date for daily lunch
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
-- Menus: public can read if published (covers both constant and daily_lunch)
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

-- Seed the single permanent constant menu row
INSERT INTO menus (type, date, published) VALUES ('constant', NULL, TRUE)
ON CONFLICT DO NOTHING;
```

> **If you already have existing tables** (with the old schema), run this migration instead:
>
> ```sql
> -- Add type column to existing menus table
> ALTER TABLE menus ADD COLUMN type TEXT NOT NULL DEFAULT 'daily_lunch';
>
> -- Make date column nullable (constant menu has NULL date)
> ALTER TABLE menus ALTER COLUMN date DROP NOT NULL;
>
> -- Create unique index so only one constant menu row exists
> CREATE UNIQUE INDEX IF NOT EXISTS idx_menus_constant ON menus (type) WHERE type = 'constant';
>
> -- Seed the single permanent constant menu row
> INSERT INTO menus (type, date, published) VALUES ('constant', NULL, TRUE)
> ON CONFLICT DO NOTHING;
> ```

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
