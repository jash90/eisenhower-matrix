/*
  # Fix sections RLS policy
  
  1. Changes
    - Drop existing insert policy
    - Add trigger to automatically set user_id
    - Create new insert policy without user_id check
*/

-- Drop existing insert policy
DROP POLICY IF EXISTS "Users can create sections" ON sections;

-- Create a trigger to set user_id on insert
CREATE OR REPLACE FUNCTION set_section_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_section_user_id_trigger
  BEFORE INSERT ON sections
  FOR EACH ROW
  EXECUTE FUNCTION set_section_user_id();

-- Create new insert policy that doesn't check user_id
CREATE POLICY "Users can create sections"
  ON sections
  FOR INSERT
  TO authenticated
  WITH CHECK (true);