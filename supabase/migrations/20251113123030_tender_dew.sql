/*
  # Add Time Fields to Daily Tasks

  1. Table Modifications
    - Add start_time and end_time fields to daily_tasks table for scheduling
    - These fields are optional and can be null

  2. Security
    - No RLS changes needed as existing policies cover the new columns
*/

-- Add time fields to daily_tasks table
ALTER TABLE daily_tasks 
ADD COLUMN IF NOT EXISTS start_time TIME,
ADD COLUMN IF NOT EXISTS end_time TIME;