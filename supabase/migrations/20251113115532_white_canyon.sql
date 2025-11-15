/*
  # Fix Row-Level Security Policies

  1. Security Updates
    - Enable RLS on goals table
    - Add proper user-based policies for goals table
    - Update policies for daily_tasks, daily_progress, and goal_metrics to check user ownership through goals
    - Ensure all operations are properly secured by user authentication

  2. Policy Changes
    - Goals: Users can only manage their own goals
    - Daily tasks: Users can only manage tasks for their own goals
    - Daily progress: Users can only manage progress for their own goals
    - Goal metrics: Users can only manage metrics for their own goals
*/

-- Enable RLS on goals table
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can manage daily tasks" ON daily_tasks;
DROP POLICY IF EXISTS "Users can manage daily progress" ON daily_progress;
DROP POLICY IF EXISTS "Users can manage goal metrics" ON goal_metrics;

-- Create policies for goals table
CREATE POLICY "Users can view own goals"
  ON goals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals"
  ON goals
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
  ON goals
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
  ON goals
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for daily_tasks
CREATE POLICY "Users can view own daily tasks"
  ON daily_tasks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM goals 
      WHERE goals.id = daily_tasks.goal_id 
      AND goals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own daily tasks"
  ON daily_tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM goals 
      WHERE goals.id = daily_tasks.goal_id 
      AND goals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own daily tasks"
  ON daily_tasks
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM goals 
      WHERE goals.id = daily_tasks.goal_id 
      AND goals.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM goals 
      WHERE goals.id = daily_tasks.goal_id 
      AND goals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own daily tasks"
  ON daily_tasks
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM goals 
      WHERE goals.id = daily_tasks.goal_id 
      AND goals.user_id = auth.uid()
    )
  );

-- Create policies for daily_progress
CREATE POLICY "Users can view own daily progress"
  ON daily_progress
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM goals 
      WHERE goals.id = daily_progress.goal_id 
      AND goals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own daily progress"
  ON daily_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM goals 
      WHERE goals.id = daily_progress.goal_id 
      AND goals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own daily progress"
  ON daily_progress
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM goals 
      WHERE goals.id = daily_progress.goal_id 
      AND goals.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM goals 
      WHERE goals.id = daily_progress.goal_id 
      AND goals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own daily progress"
  ON daily_progress
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM goals 
      WHERE goals.id = daily_progress.goal_id 
      AND goals.user_id = auth.uid()
    )
  );

-- Create policies for goal_metrics
CREATE POLICY "Users can view own goal metrics"
  ON goal_metrics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM goals 
      WHERE goals.id = goal_metrics.goal_id 
      AND goals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own goal metrics"
  ON goal_metrics
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM goals 
      WHERE goals.id = goal_metrics.goal_id 
      AND goals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own goal metrics"
  ON goal_metrics
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM goals 
      WHERE goals.id = goal_metrics.goal_id 
      AND goals.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM goals 
      WHERE goals.id = goal_metrics.goal_id 
      AND goals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own goal metrics"
  ON goal_metrics
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM goals 
      WHERE goals.id = goal_metrics.goal_id 
      AND goals.user_id = auth.uid()
    )
  );