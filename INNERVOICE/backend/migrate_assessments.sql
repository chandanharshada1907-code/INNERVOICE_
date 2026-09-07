-- Migration script for Mental Wellness Assessment table
USE innervoice;

CREATE TABLE IF NOT EXISTS mental_wellness_assessments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    assessment_type VARCHAR(20) NOT NULL,
    total_score INT NOT NULL,
    severity VARCHAR(50) NOT NULL,
    answers JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
