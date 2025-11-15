/*
  # Add Project Details and Cost Management

  1. New Tables
    - `project_costs` - Individual cost items for projects with title and amount

  2. Table Modifications
    - `projects` - Add quick_description, whatsapp_group_name, initial_project_scope, case_study_link, target_revenue
    - `project_phases` - Add completed boolean for checklist functionality
    - `invoices` - Add pdf_url for revenue document uploads

  3. Security
    - Enable RLS on new project_costs table
    - Add policies for authenticated users to manage their project costs
*/

-- Alter projects table to add new fields
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS quick_description TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_group_name TEXT,
ADD COLUMN IF NOT EXISTS initial_project_scope TEXT,
ADD COLUMN IF NOT EXISTS case_study_link TEXT,
ADD COLUMN IF NOT EXISTS target_revenue NUMERIC DEFAULT 0;

-- Alter project_phases table to add completed status
ALTER TABLE project_phases
ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT FALSE;

-- Alter invoices table to add PDF URL
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- Create project_costs table
CREATE TABLE IF NOT EXISTS project_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on project_costs table
ALTER TABLE project_costs ENABLE ROW LEVEL SECURITY;

-- Create policy for project_costs
CREATE POLICY "Users can manage project costs"
  ON project_costs
  FOR ALL
  TO authenticated
  USING (true);