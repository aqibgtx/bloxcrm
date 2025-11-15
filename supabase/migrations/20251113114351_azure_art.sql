/*
  # Productivity Tracking System

  1. New Tables
    - `goal_categories` - Categories for different types of goals (daily, weekly, monthly, yearly)
    - `daily_tasks` - Daily checklist items linked to specific goals
    - `daily_progress` - Daily progress entries for goals
    - `goal_metrics` - Trackable metrics for goals (outreaches, tasks completed, etc.)

  2. Table Modifications
    - Update `goals` table structure for better productivity tracking
    - Add category, description, and metric tracking fields

  3. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to manage their productivity data
*/

-- Create goal categories table
CREATE TABLE IF NOT EXISTS goal_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT DEFAULT '#d97706',
  icon TEXT DEFAULT 'target',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create daily tasks table for checklist items
CREATE TABLE IF NOT EXISTS daily_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid REFERENCES goals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create daily progress entries
CREATE TABLE IF NOT EXISTS daily_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid REFERENCES goals(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  metrics JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(goal_id, date)
);

-- Create goal metrics for tracking different types of activities
CREATE TABLE IF NOT EXISTS goal_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid REFERENCES goals(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  metric_value INTEGER DEFAULT 0,
  target_value INTEGER DEFAULT 0,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add new columns to existing goals table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'goals' AND column_name = 'category') THEN
    ALTER TABLE goals ADD COLUMN category TEXT DEFAULT 'general';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'goals' AND column_name = 'description') THEN
    ALTER TABLE goals ADD COLUMN description TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'goals' AND column_name = 'color') THEN
    ALTER TABLE goals ADD COLUMN color TEXT DEFAULT '#d97706';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'goals' AND column_name = 'is_active') THEN
    ALTER TABLE goals ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
  END IF;
END $$;

-- Enable RLS on new tables
ALTER TABLE goal_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies for goal_categories
CREATE POLICY "Users can view goal categories"
  ON goal_categories
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage goal categories"
  ON goal_categories
  FOR ALL
  TO authenticated
  USING (true);

-- Create policies for daily_tasks
CREATE POLICY "Users can manage daily tasks"
  ON daily_tasks
  FOR ALL
  TO authenticated
  USING (true);

-- Create policies for daily_progress
CREATE POLICY "Users can manage daily progress"
  ON daily_progress
  FOR ALL
  TO authenticated
  USING (true);

-- Create policies for goal_metrics
CREATE POLICY "Users can manage goal metrics"
  ON goal_metrics
  FOR ALL
  TO authenticated
  USING (true);

-- Insert default goal categories
INSERT INTO goal_categories (name, color, icon) VALUES
  ('Daily', '#10b981', 'calendar'),
  ('Weekly', '#3b82f6', 'calendar-days'),
  ('Monthly', '#8b5cf6', 'calendar-range'),
  ('Yearly', '#f59e0b', 'calendar-check')
ON CONFLICT DO NOTHING;

-- Insert sample productivity goals
INSERT INTO goals (title, type, category, description, target, progress, deadline, color) VALUES
  ('Daily Outreach', 'daily', 'Daily', 'Reach out to potential clients and follow up on leads', 10, 0, CURRENT_DATE + INTERVAL '1 day', '#10b981'),
  ('Weekly Project Tasks', 'weekly', 'Weekly', 'Complete assigned project tasks and deliverables', 25, 0, CURRENT_DATE + INTERVAL '7 days', '#3b82f6'),
  ('Monthly Revenue Goal', 'monthly', 'Monthly', 'Generate revenue through completed projects and new clients', 50000, 0, CURRENT_DATE + INTERVAL '1 month', '#8b5cf6'),
  ('Annual Business Growth', 'yearly', 'Yearly', 'Expand business operations and increase client base', 500000, 0, CURRENT_DATE + INTERVAL '1 year', '#f59e0b')
ON CONFLICT DO NOTHING;