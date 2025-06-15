-- Set default value for createdByAdmin field
UPDATE users SET created_by_admin = false WHERE id > 0 AND created_by_admin IS NULL; 