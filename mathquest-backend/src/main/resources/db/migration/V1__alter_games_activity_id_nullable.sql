-- Make activity_id column nullable in games table
ALTER TABLE games MODIFY COLUMN activity_id BIGINT NULL; 