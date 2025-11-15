/*
  # Remove Daily Goals and Update Task System

  1. Database Changes
    - Remove daily goals from goals table (type = 'daily')
    - Keep daily_tasks table structure as is for historical data
    - Daily tasks will reset daily but maintain historical records

  2. Goal Types
    - Remove 'daily' type from goals
    - Keep weekly, monthly, yearly goals only

  3. Task System
    - Tasks are linked to specific goals via goal_id
    - Tasks reset daily (new tasks can be added each day)
    - Previous tasks remain stored for historical reference
*/

-- Remove all daily goals and their related data
DELETE FROM daily_tasks WHERE goal_id IN (
  SELECT id FROM goals WHERE type = 'daily'
);

DELETE FROM daily_progress WHERE goal_id IN (
  SELECT id FROM goals WHERE type = 'daily'
);

DELETE FROM goal_metrics WHERE goal_id IN (
  SELECT id FROM goals WHERE type = 'daily'
);

DELETE FROM goals WHERE type = 'daily';

-- Remove daily category from goal_categories
DELETE FROM goal_categories WHERE name = 'Daily';