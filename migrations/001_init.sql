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

-- Enable Realtime (we'll do via SQL but usually via dashboard; supabase realtime is a extension)
-- For simplicity, we'll note that realtime needs to be enabled via dashboard or via supabase realtime extension.
-- We'll add a comment.

-- RLS policies will be set via separate commands; we can do them now.

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

-- Orders: public can insert (customer places order), but only authenticated service role can select/update
CREATE POLICY "Anyone can insert orders" ON orders
  FOR INSERT WITH CHECK (TRUE);

-- Feedback: public can insert
CREATE POLICY "Anyone can insert feedback" ON feedback
  FOR INSERT WITH CHECK (TRUE);

-- For admin dashboard, we'll rely on service role key bypassing RLS (as per plan).
