/*
  # Filter Inactive Projects from Dashboard and Finance

  1. Changes
    - Create get_dashboard_data RPC function that excludes inactive projects
    - Function returns dashboard statistics and data excluding projects with status = 'Inactive'

  2. Security
    - Function is accessible to authenticated users
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_dashboard_data(INT, INT);

-- Create get_dashboard_data function
CREATE OR REPLACE FUNCTION get_dashboard_data(p_month INT, p_year INT)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
  stats JSON;
  weekly_outreaches JSON;
  reminders_data JSON;
  todays_tasks JSON;
  project_progress JSON;
  monthly_projects JSON;
BEGIN
  -- Calculate stats (excluding inactive projects)
  SELECT json_build_object(
    'totalProjects', COUNT(*),
    'activeProjects', COUNT(*) FILTER (WHERE status = 'Active'),
    'completedProjects', COUNT(*) FILTER (WHERE status = 'Closed'),
    'totalRevenue', COALESCE(SUM(target_revenue), 0),
    'convertedLeads', (SELECT COUNT(*) FROM clients WHERE status = 'converted'),
    'interestedLeads', (SELECT COUNT(*) FROM clients WHERE status = 'interested')
  )
  INTO stats
  FROM projects
  WHERE status != 'Inactive'
    AND EXTRACT(MONTH FROM created_at) = p_month
    AND EXTRACT(YEAR FROM created_at) = p_year;

  -- Calculate outreach stats and merge with stats (based on goal creation month)
  stats := (stats::jsonb || json_build_object(
    'monthlyOutreaches', (
      SELECT COALESCE(SUM(
        CASE
          WHEN dt.title ~* 'ot\s*(\d+)' THEN (regexp_match(dt.title, 'ot\s*(\d+)', 'i'))[1]::int
          WHEN dt.title ~* 'outreach\s*(\d+)' THEN (regexp_match(dt.title, 'outreach\s*(\d+)', 'i'))[1]::int
          ELSE 0
        END
      ), 0)
      FROM daily_tasks dt
      JOIN goals g ON dt.goal_id = g.id
      WHERE dt.completed = true
        AND g.type = 'monthly'
        AND EXTRACT(MONTH FROM g.created_at) = p_month
        AND EXTRACT(YEAR FROM g.created_at) = p_year
    ),
    'totalOutreaches', (
      SELECT COALESCE(SUM(
        CASE
          WHEN dt.title ~* 'ot\s*(\d+)' THEN (regexp_match(dt.title, 'ot\s*(\d+)', 'i'))[1]::int
          WHEN dt.title ~* 'outreach\s*(\d+)' THEN (regexp_match(dt.title, 'outreach\s*(\d+)', 'i'))[1]::int
          ELSE 0
        END
      ), 0)
      FROM daily_tasks dt
      WHERE dt.completed = true
    )
  )::jsonb)::json;

  -- Get weekly outreach data (current week, day by day)
  SELECT json_agg(json_build_object('day', day_letter, 'value', outreach_count) ORDER BY day_num)
  INTO weekly_outreaches
  FROM (
    SELECT
      days.day_num,
      CASE days.day_num
        WHEN 0 THEN 'S'
        WHEN 1 THEN 'M'
        WHEN 2 THEN 'T'
        WHEN 3 THEN 'W'
        WHEN 4 THEN 'T'
        WHEN 5 THEN 'F'
        WHEN 6 THEN 'S'
      END as day_letter,
      COALESCE(SUM(
        CASE
          WHEN dt.title ~* 'ot\s*(\d+)' THEN (regexp_match(dt.title, 'ot\s*(\d+)', 'i'))[1]::int
          WHEN dt.title ~* 'outreach\s*(\d+)' THEN (regexp_match(dt.title, 'outreach\s*(\d+)', 'i'))[1]::int
          ELSE 0
        END
      ), 0) as outreach_count
    FROM (
      SELECT generate_series(0, 6) as day_num
    ) days
    LEFT JOIN daily_tasks dt ON
      EXTRACT(DOW FROM dt.date) = days.day_num
      AND dt.completed = true
      AND dt.date >= CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::int
      AND dt.date < CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::int + 7
    GROUP BY days.day_num
  ) subquery;

  -- Get reminders
  SELECT json_agg(reminder_data)
  INTO reminders_data
  FROM (
    SELECT json_build_object(
      'id', id,
      'title', title,
      'start_time', start_time,
      'end_time', end_time,
      'description', description
    ) as reminder_data
    FROM reminders
    WHERE DATE(start_time) >= CURRENT_DATE
    ORDER BY start_time
    LIMIT 5
  ) subquery;

  -- Get today's tasks with goal titles (using Malaysia timezone)
  SELECT json_agg(task_data)
  INTO todays_tasks
  FROM (
    SELECT json_build_object(
      'id', dt.id,
      'title', dt.title,
      'completed', dt.completed,
      'start_time', dt.start_time,
      'end_time', dt.end_time,
      'goal_id', dt.goal_id,
      'goal_title', g.title
    ) as task_data
    FROM daily_tasks dt
    LEFT JOIN goals g ON dt.goal_id = g.id
    WHERE dt.date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kuala_Lumpur')::date
    ORDER BY dt.start_time NULLS LAST
  ) subquery;

  -- Get project progress (current month projects excluding inactive)
  SELECT json_agg(progress_data)
  INTO project_progress
  FROM (
    SELECT json_build_object(
      'id', id,
      'name', name,
      'progress', progress,
      'status', status
    ) as progress_data
    FROM projects
    WHERE status != 'Inactive'
      AND EXTRACT(MONTH FROM created_at) = p_month
      AND EXTRACT(YEAR FROM created_at) = p_year
    ORDER BY created_at DESC
  ) subquery;

  -- Get monthly projects (excluding inactive projects)
  SELECT json_agg(project_data)
  INTO monthly_projects
  FROM (
    SELECT json_build_object(
      'id', id,
      'name', name,
      'status', status,
      'progress', progress,
      'due_date', due_date
    ) as project_data
    FROM projects
    WHERE status != 'Inactive'
      AND EXTRACT(MONTH FROM created_at) = p_month
      AND EXTRACT(YEAR FROM created_at) = p_year
    ORDER BY created_at DESC
  ) subquery;

  -- Build final result
  result := json_build_object(
    'stats', stats,
    'weeklyOutreaches', COALESCE(weekly_outreaches, '[]'::json),
    'reminders', COALESCE(reminders_data, '[]'::json),
    'todaysTasks', COALESCE(todays_tasks, '[]'::json),
    'projectProgress', COALESCE(project_progress, '[]'::json),
    'monthlyProjects', COALESCE(monthly_projects, '[]'::json)
  );

  RETURN result;
END;
$$;
