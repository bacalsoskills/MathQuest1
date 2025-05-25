-- Modify the games table structure to allow direct association with classrooms
ALTER TABLE games MODIFY COLUMN activity_id BIGINT NULL;
ALTER TABLE games ADD COLUMN classroom_id BIGINT NULL;
ALTER TABLE games ADD CONSTRAINT fk_games_classroom FOREIGN KEY (classroom_id) REFERENCES classrooms(id);

-- Add constraint to ensure either activity_id or classroom_id is set (but not both)
ALTER TABLE games ADD CONSTRAINT check_game_association 
    CHECK ((activity_id IS NOT NULL AND classroom_id IS NULL) OR 
           (activity_id IS NULL AND classroom_id IS NOT NULL));

-- Update existing indexes
CREATE INDEX idx_games_classroom ON games(classroom_id); 