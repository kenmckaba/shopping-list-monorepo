-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  last_opened_list_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shopping_lists table
CREATE TABLE shopping_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create list_items table
CREATE TABLE list_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  shopping_list_id UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_shopping_lists_owner ON shopping_lists(owner_id);
CREATE INDEX idx_list_items_shopping_list ON list_items(shopping_list_id);
CREATE INDEX idx_list_items_created_by ON list_items(created_by);

-- Add unique constraint to prevent duplicate items in the same list
ALTER TABLE list_items ADD CONSTRAINT unique_item_per_list UNIQUE (name, shopping_list_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shopping_lists_updated_at BEFORE UPDATE ON shopping_lists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_list_items_updated_at BEFORE UPDATE ON list_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies (optional - for when you add auth later)
-- Users can read/update their own profile
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (true);
CREATE POLICY "Anyone can insert users" ON users FOR INSERT WITH CHECK (true);

-- Users can manage their own shopping lists
CREATE POLICY "Users can view own lists" ON shopping_lists FOR SELECT USING (true);
CREATE POLICY "Users can create lists" ON shopping_lists FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own lists" ON shopping_lists FOR UPDATE USING (true);
CREATE POLICY "Users can delete own lists" ON shopping_lists FOR DELETE USING (true);

-- Users can manage items in lists they own or have access to
CREATE POLICY "Users can view list items" ON list_items FOR SELECT USING (true);
CREATE POLICY "Users can create list items" ON list_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update list items" ON list_items FOR UPDATE USING (true);
CREATE POLICY "Users can delete list items" ON list_items FOR DELETE USING (true);