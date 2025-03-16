/*
  # Add custom sections support
  
  1. New Tables
    - `sections`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `order` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on sections table
    - Add policies for authenticated users to manage their sections
*/

CREATE TABLE sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  "order" integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE sections ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own sections
CREATE POLICY "Users can view own sections"
  ON sections
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can create their own sections
CREATE POLICY "Users can create sections"
  ON sections
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own sections
CREATE POLICY "Users can update own sections"
  ON sections
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own sections
CREATE POLICY "Users can delete own sections"
  ON sections
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add section_id to tasks table
ALTER TABLE tasks ADD COLUMN section_id uuid REFERENCES sections;