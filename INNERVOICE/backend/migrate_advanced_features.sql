-- INNERVOICE Database Schema Update - Advanced Features
USE innervoice;

-- PHASE 1: Personalized Wellness Score
CREATE TABLE IF NOT EXISTS wellness_scores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    score INT NOT NULL,
    change_reason VARCHAR(255) DEFAULT 'Calculated based on daily activity.',
    score_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uq_user_date (user_id, score_date)
);
