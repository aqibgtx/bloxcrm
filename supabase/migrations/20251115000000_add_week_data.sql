-- Add week_titles and week_descriptions columns to goals table
ALTER TABLE public.goals
ADD COLUMN IF NOT EXISTS week_titles jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS week_descriptions jsonb DEFAULT '{}'::jsonb;
