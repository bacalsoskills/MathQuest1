-- Drop foreign key constraint on activities table for lesson_id
ALTER TABLE activities DROP FOREIGN KEY IF EXISTS activities_ibfk_lesson;

-- Add classroom_id column if not exists
ALTER TABLE activities ADD COLUMN IF NOT EXISTS classroom_id BIGINT;

-- Update classroom_id values from lessons table
UPDATE activities a
JOIN lessons l ON a.lesson_id = l.id
SET a.classroom_id = l.classroom_id;

-- Make classroom_id not null
ALTER TABLE activities MODIFY COLUMN classroom_id BIGINT NOT NULL;

-- Add foreign key constraint for classroom_id
ALTER TABLE activities ADD CONSTRAINT activities_ibfk_classroom 
FOREIGN KEY (classroom_id) REFERENCES classrooms(id);

-- Drop the lesson_id column
ALTER TABLE activities DROP COLUMN lesson_id; 