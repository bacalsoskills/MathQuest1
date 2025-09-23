-- Create multiplication_learning_progress table
CREATE TABLE multiplication_learning_progress (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    completed_properties JSON,
    active_property_index INT NOT NULL DEFAULT 0,
    total_properties_completed INT NOT NULL DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_progress (user_id)
);

-- Create multiplication_property_completions table
CREATE TABLE multiplication_property_completions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    progress_id BIGINT NOT NULL,
    property_index INT NOT NULL,
    property_name VARCHAR(255) NOT NULL,
    badge_name VARCHAR(255) NOT NULL,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_steps INT,
    completion_time_seconds BIGINT,
    FOREIGN KEY (progress_id) REFERENCES multiplication_learning_progress(id) ON DELETE CASCADE,
    UNIQUE KEY unique_property_completion (progress_id, property_index)
);

-- Create multiplication_quiz_attempts table
CREATE TABLE multiplication_quiz_attempts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    progress_id BIGINT NOT NULL,
    property_index INT NOT NULL,
    step_index INT NOT NULL,
    question TEXT,
    user_answer TEXT,
    correct_answer TEXT,
    is_correct BOOLEAN NOT NULL,
    step_type VARCHAR(50) NOT NULL,
    step_title VARCHAR(255),
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (progress_id) REFERENCES multiplication_learning_progress(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_multiplication_progress_user_id ON multiplication_learning_progress(user_id);
CREATE INDEX idx_property_completions_progress_id ON multiplication_property_completions(progress_id);
CREATE INDEX idx_quiz_attempts_progress_id ON multiplication_quiz_attempts(progress_id);
CREATE INDEX idx_quiz_attempts_property_step ON multiplication_quiz_attempts(progress_id, property_index, step_index);
CREATE INDEX idx_quiz_attempts_attempted_at ON multiplication_quiz_attempts(attempted_at);
