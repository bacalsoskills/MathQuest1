-- First, add a temporary column
ALTER TABLE quizzes ADD COLUMN quiz_type_new VARCHAR(20) NOT NULL DEFAULT 'PRACTICE_QUIZ';

-- Copy data from old column to new column
UPDATE quizzes SET quiz_type_new = quiz_type;

-- Drop the old column
ALTER TABLE quizzes DROP COLUMN quiz_type;

-- Rename the new column to the original name
ALTER TABLE quizzes CHANGE quiz_type_new quiz_type VARCHAR(20) NOT NULL; 