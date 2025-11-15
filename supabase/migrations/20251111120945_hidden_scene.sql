/*
  # Blox CRM Database Schema Setup

  1. New Tables
    - `projects` - Main projects with client relationships, status tracking, and progress
    - `clients` - Client information and contact details
    - `project_phases` - Individual project phases with milestones and deadlines
    - `invoices` - Project invoicing with payment tracking
    - `goals` - User goals with progress tracking and deadlines
    - `team_members` - Team collaboration and member status
    - `reminders` - Meeting and task reminders with time scheduling
    - `project_files` - File attachments and uploads for projects

  2. Security
    - All tables created without RLS for development simplicity
    - Production deployments should enable RLS with appropriate policies

  3. Features
    - UUID primary keys for all tables
    - Proper foreign key relationships
    - Default values for timestamps and progress tracking
    - Flexible status and type fields for categorization
*/

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  client_id uuid,
  description text,
  status text DEFAULT 'Pending',
  progress int DEFAULT 0,
  due_date date,
  created_at timestamp DEFAULT now()
);

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  company text,
  email text,
  phone text,
  notes text,
  created_at timestamp DEFAULT now()
);

-- Project phases table
CREATE TABLE IF NOT EXISTS project_phases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  title text,
  description text,
  milestone text,
  due_date date,
  progress int DEFAULT 0,
  created_at timestamp DEFAULT now()
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  amount numeric DEFAULT 0,
  status text DEFAULT 'pending',
  date_issued date DEFAULT now(),
  due_date date,
  paid boolean DEFAULT false,
  created_at timestamp DEFAULT now()
);

-- Goals table
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  type text DEFAULT 'monthly',
  target int DEFAULT 0,
  progress int DEFAULT 0,
  deadline date,
  title text,
  created_at timestamp DEFAULT now()
);

-- Team members table
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  role text,
  status text DEFAULT 'Active',
  avatar_url text,
  created_at timestamp DEFAULT now()
);

-- Reminders table
CREATE TABLE IF NOT EXISTS reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  start_time timestamptz,
  end_time timestamptz,
  description text,
  created_at timestamp DEFAULT now()
);

-- Project files table
CREATE TABLE IF NOT EXISTS project_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  file_name text,
  file_url text,
  file_size int,
  uploaded_at timestamp DEFAULT now()
);

-- Insert sample data for development
INSERT INTO clients (id, name, company, email, phone, notes) VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'Arc Company', 'Arc Tech Solutions', 'contact@arc.com', '+1-555-0101', 'Strategic technology partner'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Tech Solutions', 'Tech Solutions Inc', 'hello@techsolutions.com', '+1-555-0102', 'Mobile development specialist'),
  ('550e8400-e29b-41d4-a716-446655440003', 'StartupCo', 'StartupCo Ltd', 'team@startupco.com', '+1-555-0103', 'Fast-growing startup'),
  ('550e8400-e29b-41d4-a716-446655440004', 'Enterprise Ltd', 'Enterprise Solutions', 'sales@enterprise.com', '+1-555-0104', 'Large enterprise client');

INSERT INTO projects (id, name, client_id, description, status, progress, due_date) VALUES 
  ('660e8400-e29b-41d4-a716-446655440001', 'Develop API Endpoints', '550e8400-e29b-41d4-a716-446655440001', 'Create RESTful API endpoints for client application', 'Active', 75, '2024-12-26'),
  ('660e8400-e29b-41d4-a716-446655440002', 'Website Redesign', '550e8400-e29b-41d4-a716-446655440001', 'Complete website redesign with modern UI/UX', 'Active', 45, '2024-01-15'),
  ('660e8400-e29b-41d4-a716-446655440003', 'Mobile App Development', '550e8400-e29b-41d4-a716-446655440002', 'Native mobile app for iOS and Android', 'Active', 60, '2024-02-28'),
  ('660e8400-e29b-41d4-a716-446655440004', 'Onboarding Flow', '550e8400-e29b-41d4-a716-446655440003', 'User onboarding and authentication system', 'Active', 30, '2024-12-30'),
  ('660e8400-e29b-41d4-a716-446655440005', 'Build Dashboard', '550e8400-e29b-41d4-a716-446655440003', 'Analytics dashboard with real-time data', 'Active', 55, '2024-12-30'),
  ('660e8400-e29b-41d4-a716-446655440006', 'Brand Identity', '550e8400-e29b-41d4-a716-446655440003', 'Complete brand identity and design system', 'Pending', 0, '2024-01-20'),
  ('660e8400-e29b-41d4-a716-446655440007', 'System Integration', '550e8400-e29b-41d4-a716-446655440004', 'Integrate with existing enterprise systems', 'Active', 25, '2024-03-15'),
  ('660e8400-e29b-41d4-a716-446655440008', 'Optimize Page Load', '550e8400-e29b-41d4-a716-446655440001', 'Performance optimization and caching', 'Pending', 0, NULL),
  ('660e8400-e29b-41d4-a716-446655440009', 'Cross-Browser Testing', '550e8400-e29b-41d4-a716-446655440002', 'Comprehensive browser compatibility testing', 'Closed', 100, '2024-12-06');

INSERT INTO team_members (id, name, role, status, avatar_url) VALUES 
  ('770e8400-e29b-41d4-a716-446655440001', 'Alexandra Deff', 'GitHub Project Repository', 'Completed', NULL),
  ('770e8400-e29b-41d4-a716-446655440002', 'Edwin Adamike', 'Integrate User Authentication System', 'In Progress', NULL),
  ('770e8400-e29b-41d4-a716-446655440003', 'Isaac Oluwatemilorum', 'Develop Search and Filter Functionality', 'Pending', NULL),
  ('770e8400-e29b-41d4-a716-446655440004', 'David Oshodi', 'Responsive Layout for Homepage', 'In Progress', NULL);

INSERT INTO reminders (id, title, start_time, end_time, description) VALUES 
  ('880e8400-e29b-41d4-a716-446655440001', 'Meeting with Arc Company', '2024-12-09T10:00:00Z', '2024-12-09T11:00:00Z', 'Discuss project requirements and timeline');

INSERT INTO goals (id, user_id, type, target, progress, deadline, title) VALUES 
  ('990e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'monthly', 20, 14, '2024-01-31', 'Complete 20 Projects'),
  ('990e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'quarterly', 100000, 65000, '2024-03-31', 'Generate RM 100K Revenue'),
  ('990e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'monthly', 10, 7, '2024-01-31', 'Onboard 10 New Clients'),
  ('990e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 'yearly', 15, 8, '2024-12-31', 'Improve Team Productivity by 15%');

INSERT INTO invoices (id, project_id, amount, status, date_issued, due_date, paid) VALUES 
  ('aa0e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440002', 15000, 'partial', '2024-01-01', '2024-01-15', false),
  ('aa0e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440003', 25000, 'paid', '2024-01-05', '2024-01-10', true),
  ('aa0e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440006', 8000, 'pending', '2024-01-15', '2024-01-20', false),
  ('aa0e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440007', 35000, 'partial', '2024-01-01', '2024-01-05', false);