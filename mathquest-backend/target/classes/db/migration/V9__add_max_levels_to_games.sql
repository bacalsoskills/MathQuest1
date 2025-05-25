-- Add max_levels column to games table with default value 10
ALTER TABLE games ADD COLUMN max_levels INT NOT NULL DEFAULT 10; 