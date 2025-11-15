/*
  # Remove Progress Tracking System

  1. Database Changes
    - Drop daily_progress table and its data
    - Drop goal_metrics table and its data
    - Remove RLS policies for these tables

  2. Clean Up
    - Remove all progress tracking related data
    - Keep goals and daily_tasks tables intact
*/

-- Drop policies first
DROP POLICY IF EXISTS "Users can view own daily progress" ON daily_progress;
DROP POLICY IF EXISTS "Users can insert own daily progress" ON daily_progress;
DROP POLICY IF EXISTS "Users can update own daily progress" ON daily_progress;
DROP POLICY IF EXISTS "Users can delete own daily progress" ON daily_progress;

DROP POLICY IF EXISTS "Users can view own goal metrics" ON goal_metrics;
DROP POLICY IF EXISTS "Users can insert own goal metrics" ON goal_metrics;
DROP POLICY IF EXISTS "Users can update own goal metrics" ON goal_metrics;
DROP POLICY IF EXISTS "Users can delete own goal metrics" ON goal_metrics;

-- Drop tables
DROP TABLE IF EXISTS daily_progress;
DROP TABLE IF EXISTS goal_metrics;