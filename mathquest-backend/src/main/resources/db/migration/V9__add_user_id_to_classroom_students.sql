-- Add user_id column to classroom_students table
ALTER TABLE classroom_students ADD COLUMN user_id BIGINT;

-- Update existing records to set user_id from student_id
UPDATE classroom_students cs
JOIN users u ON cs.student_id = u.id
SET cs.user_id = u.id;

-- Make user_id not null after data migration
ALTER TABLE classroom_students MODIFY COLUMN user_id BIGINT NOT NULL;

-- Add foreign key constraint
ALTER TABLE classroom_students ADD CONSTRAINT fk_classroom_students_user
FOREIGN KEY (user_id) REFERENCES users(id); 