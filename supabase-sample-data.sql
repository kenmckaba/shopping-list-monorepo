-- Sample data for testing (run this after schema.sql)

-- Insert sample users
INSERT INTO users (id, name, email) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'John Doe', 'john@example.com'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Jane Smith', 'jane@example.com');

-- Insert sample shopping lists
INSERT INTO shopping_lists (id, title, owner_id) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', 'Weekly Groceries', '550e8400-e29b-41d4-a716-446655440001'),
  ('660e8400-e29b-41d4-a716-446655440002', 'Party Supplies', '550e8400-e29b-41d4-a716-446655440001'),
  ('660e8400-e29b-41d4-a716-446655440003', 'Meal Prep', '550e8400-e29b-41d4-a716-446655440002');

-- Insert sample list items
INSERT INTO list_items (name, quantity, is_completed, shopping_list_id, created_by) VALUES
  -- Weekly Groceries items
  ('Milk', 2, false, '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001'),
  ('Bread', 1, true, '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001'),
  ('Eggs', 12, false, '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001'),
  ('Bananas', 6, false, '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001'),

  -- Party Supplies items
  ('Balloons', 20, false, '660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001'),
  ('Cake', 1, false, '660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001'),
  ('Paper Plates', 2, true, '660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001'),

  -- Meal Prep items
  ('Chicken Breast', 2, false, '660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002'),
  ('Rice', 1, false, '660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002'),
  ('Vegetables', 5, true, '660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002');

-- Update last opened list for users
UPDATE users SET last_opened_list_id = '660e8400-e29b-41d4-a716-446655440001' WHERE id = '550e8400-e29b-41d4-a716-446655440001';
UPDATE users SET last_opened_list_id = '660e8400-e29b-41d4-a716-446655440003' WHERE id = '550e8400-e29b-41d4-a716-446655440002';