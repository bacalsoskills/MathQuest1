-- Add email verification expiry column
ALTER TABLE users ADD COLUMN email_verification_expiry DATETIME NULL; 