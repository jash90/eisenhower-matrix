/*
  # Fix Tasks RLS Policies

  1. Changes
    - Update the insert policy to properly set user_id
    - Add a trigger to automatically set user_id on insert

  2. Security
    - Ensures tasks are always created with the correct user_id
    - Maintains data isolation between users
*/

-- Drop existing insert policy
DROP POLICY IF EXISTS "Users can insert own tasks" ON tasks;

-- Create a trigger to set user_id on insert
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_user_id_trigger
  BEFORE INSERT ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();

-- Create new insert policy that doesn't check user_id
CREATE POLICY "Users can insert own tasks"
  ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (true);