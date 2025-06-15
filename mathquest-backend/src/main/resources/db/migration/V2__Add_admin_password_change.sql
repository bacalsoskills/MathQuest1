-- Add admin_password_change column with default value
ALTER TABLE users ADD COLUMN admin_password_change BOOLEAN NOT NULL DEFAULT FALSE; 