/*
  # Add Foreign Key Relationship Between Projects and Clients

  1. Changes
    - Add foreign key constraint linking projects.client_id to clients.id
    - This enables Supabase to resolve nested queries between projects and clients

  2. Security
    - No RLS changes needed for this constraint addition
*/

-- Add foreign key constraint between projects and clients
ALTER TABLE projects 
ADD CONSTRAINT projects_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;