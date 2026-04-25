-- Shopping List Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- Enable Row Level Security
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.list_shares ENABLE ROW LEVEL SECURITY;

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    last_opened_list_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shopping Lists table
CREATE TABLE IF NOT EXISTS public.shopping_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Items table
CREATE TABLE IF NOT EXISTS public.items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    category TEXT,
    created_by_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- List Items table
CREATE TABLE IF NOT EXISTS public.list_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quantity INTEGER DEFAULT 1,
    is_completed BOOLEAN DEFAULT FALSE,
    notes TEXT,
    list_id UUID NOT NULL REFERENCES public.shopping_lists(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(list_id, item_id)
);

-- List Shares table
CREATE TABLE IF NOT EXISTS public.list_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    permission TEXT DEFAULT 'view',
    list_id UUID NOT NULL REFERENCES public.shopping_lists(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(list_id, user_id)
);

-- Update triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_shopping_lists_updated_at ON public.shopping_lists;
CREATE TRIGGER update_shopping_lists_updated_at BEFORE UPDATE ON public.shopping_lists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_items_updated_at ON public.items;
CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON public.items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_list_items_updated_at ON public.list_items;
CREATE TRIGGER update_list_items_updated_at BEFORE UPDATE ON public.list_items FOR EACH ROW EXECUTE FUNCTION update_list_items_updated_at_column();

-- Row Level Security Policies

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Shopping Lists policies
CREATE POLICY "Users can view own lists" ON public.shopping_lists
    FOR SELECT USING (
        auth.uid()::text = owner_id::text OR 
        is_public = true OR
        id IN (SELECT list_id FROM public.list_shares WHERE user_id::text = auth.uid()::text)
    );

CREATE POLICY "Users can create own lists" ON public.shopping_lists
    FOR INSERT WITH CHECK (auth.uid()::text = owner_id::text);

CREATE POLICY "Users can update own lists" ON public.shopping_lists
    FOR UPDATE USING (auth.uid()::text = owner_id::text);

CREATE POLICY "Users can delete own lists" ON public.shopping_lists
    FOR DELETE USING (auth.uid()::text = owner_id::text);

-- Items policies (all users can see all items for sharing)
CREATE POLICY "Anyone can view items" ON public.items
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create items" ON public.items
    FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = created_by_id::text);

-- List Items policies
CREATE POLICY "Users can view list items for accessible lists" ON public.list_items
    FOR SELECT USING (
        list_id IN (
            SELECT id FROM public.shopping_lists 
            WHERE owner_id::text = auth.uid()::text OR 
                  is_public = true OR
                  id IN (SELECT list_id FROM public.list_shares WHERE user_id::text = auth.uid()::text)
        )
    );

CREATE POLICY "Users can manage list items for own lists" ON public.list_items
    FOR ALL USING (
        list_id IN (
            SELECT id FROM public.shopping_lists 
            WHERE owner_id::text = auth.uid()::text
        )
    );

-- List Shares policies
CREATE POLICY "Users can view shares for own lists" ON public.list_shares
    FOR SELECT USING (
        list_id IN (
            SELECT id FROM public.shopping_lists 
            WHERE owner_id::text = auth.uid()::text
        ) OR user_id::text = auth.uid()::text
    );

CREATE POLICY "Users can manage shares for own lists" ON public.list_shares
    FOR ALL USING (
        list_id IN (
            SELECT id FROM public.shopping_lists 
            WHERE owner_id::text = auth.uid()::text
        )
    );

-- Insert some sample data (optional)
INSERT INTO public.users (id, name, email) VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', 'John Doe', 'john@example.com'),
    ('550e8400-e29b-41d4-a716-446655440001', 'Jane Smith', 'jane@example.com')
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.items (name, category, created_by_id) VALUES 
    ('Apple', 'Fruit', '550e8400-e29b-41d4-a716-446655440000'),
    ('Banana', 'Fruit', '550e8400-e29b-41d4-a716-446655440000'),
    ('Milk', 'Dairy', '550e8400-e29b-41d4-a716-446655440000'),
    ('Bread', 'Bakery', '550e8400-e29b-41d4-a716-446655440000')
ON CONFLICT (name) DO NOTHING;