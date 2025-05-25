-- Drop the foreign key constraint
ALTER TABLE activities DROP FOREIGN KEY IF EXISTS fk_activities_lesson;

-- Drop the lesson_id column
ALTER TABLE activities DROP COLUMN IF EXISTS lesson_id; 