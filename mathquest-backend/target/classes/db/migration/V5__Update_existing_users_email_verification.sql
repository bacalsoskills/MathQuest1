-- Update existing users to have proper email verification settings
UPDATE users 
SET email_verification_required = CASE 
    WHEN created_by_admin = 1 THEN 0  -- Admin-created users don't require verification
    ELSE 1  -- Self-registered users require verification
END,
email_verified = CASE 
    WHEN created_by_admin = 1 THEN 1  -- Admin-created users are verified by default
    ELSE 0  -- Self-registered users start unverified
END
WHERE id > 0 AND email_verification_required IS NULL; 