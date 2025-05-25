-- Add max_levels column to games table with default value 10
ALTER TABLE games ADD COLUMN max_levels INT NOT NULL DEFAULT 10;

-- Update existing records to have max_levels = 10
UPDATE games SET max_levels = 10 WHERE max_levels IS NULL; 