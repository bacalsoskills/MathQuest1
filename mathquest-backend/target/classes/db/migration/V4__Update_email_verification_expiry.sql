-- Update email verification expiry column to allow NULL values
ALTER TABLE users MODIFY COLUMN email_verification_expiry DATETIME NULL; 