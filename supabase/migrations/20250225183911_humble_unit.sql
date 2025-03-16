/*
  # Add section deletion cascade

  1. Changes
    - Add ON DELETE SET NULL to tasks.section_id foreign key
    - This ensures tasks aren't orphaned when a section is deleted

  2. Implementation
    - Drop existing foreign key constraint
    - Re-create with ON DELETE SET NULL
*/

-- Drop existing foreign key constraint
ALTER TABLE tasks
DROP CONSTRAINT IF EXISTS tasks_section_id_fkey;

-- Re-create with ON DELETE SET NULL
ALTER TABLE tasks
ADD CONSTRAINT tasks_section_id_fkey
FOREIGN KEY (section_id)
REFERENCES sections(id)
ON DELETE SET NULL;