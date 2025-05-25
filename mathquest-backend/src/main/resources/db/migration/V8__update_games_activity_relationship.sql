-- Drop the classroom_id column and its foreign key constraint
ALTER TABLE games DROP FOREIGN KEY IF EXISTS fk_games_classroom;
ALTER TABLE games DROP COLUMN IF EXISTS classroom_id;

-- Make activity_id non-nullable
ALTER TABLE games MODIFY COLUMN activity_id BIGINT NOT NULL;

-- Add foreign key constraint
ALTER TABLE games ADD CONSTRAINT fk_games_activity 
FOREIGN KEY (activity_id) REFERENCES activities(id); 