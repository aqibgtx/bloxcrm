/*
  # Add Client Status Management for Leads

  1. Table Modifications
    - Add status column to clients table for lead management
    - Add index for better query performance on status filtering

  2. Status Values
    - 'interested' - New leads who have shown interest
    - 'client' - Clients with active projects (automatically determined)
    - 'converted' - Successfully converted leads

  3. Security
    - No RLS changes needed as existing policies cover the new column
*/

-- Add status column to clients table
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'interested';

-- Add index for status filtering
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);

-- Update existing clients with projects to have 'client' status
UPDATE clients 
SET status = 'client' 
WHERE id IN (
  SELECT DISTINCT client_id 
  FROM projects 
  WHERE client_id IS NOT NULL
);