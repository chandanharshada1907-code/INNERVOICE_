-- INNERVOICE Database Schema Update - Four New Features
USE innervoice;

-- 1. Voice Journals
CREATE TABLE IF NOT EXISTS voice_journals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    transcript TEXT NOT NULL,
    duration VARCHAR(50) DEFAULT '00:00',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 2. Emotion Triggers
CREATE TABLE IF NOT EXISTS emotion_triggers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) DEFAULT 'Other',
    user_id INT DEFAULT NULL, -- NULL means default system-wide trigger
    is_custom BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Pre-populate some default triggers if empty
INSERT INTO emotion_triggers (name, category)
SELECT 'College / Studies', 'Education' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM emotion_triggers WHERE name='College / Studies' AND user_id IS NULL)
UNION ALL SELECT 'Work', 'Career' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM emotion_triggers WHERE name='Work' AND user_id IS NULL)
UNION ALL SELECT 'Relationships', 'Social' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM emotion_triggers WHERE name='Relationships' AND user_id IS NULL)
UNION ALL SELECT 'Family', 'Social' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM emotion_triggers WHERE name='Family' AND user_id IS NULL)
UNION ALL SELECT 'Social interaction', 'Social' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM emotion_triggers WHERE name='Social interaction' AND user_id IS NULL)
UNION ALL SELECT 'Sleep', 'Health' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM emotion_triggers WHERE name='Sleep' AND user_id IS NULL)
UNION ALL SELECT 'Exercise', 'Health' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM emotion_triggers WHERE name='Exercise' AND user_id IS NULL)
UNION ALL SELECT 'Food', 'Health' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM emotion_triggers WHERE name='Food' AND user_id IS NULL)
UNION ALL SELECT 'Personal achievement', 'Personal' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM emotion_triggers WHERE name='Personal achievement' AND user_id IS NULL)
UNION ALL SELECT 'Financial concern', 'Finance' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM emotion_triggers WHERE name='Financial concern' AND user_id IS NULL)
UNION ALL SELECT 'Free time', 'Personal' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM emotion_triggers WHERE name='Free time' AND user_id IS NULL);

-- 3. Mood Triggers (Mapping mood entry to trigger and context)
CREATE TABLE IF NOT EXISTS mood_triggers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mood_id INT NOT NULL,
    trigger_id INT NOT NULL,
    context_note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mood_id) REFERENCES moods(mood_id) ON DELETE CASCADE,
    FOREIGN KEY (trigger_id) REFERENCES emotion_triggers(id) ON DELETE CASCADE
);

-- 4. Focus Sessions
CREATE TABLE IF NOT EXISTS focus_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    task_name VARCHAR(255) DEFAULT 'Focus Session',
    duration INT NOT NULL, -- duration in minutes
    completed BOOLEAN DEFAULT TRUE,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. AI Memory (Personalized Preferences)
CREATE TABLE IF NOT EXISTS ai_memory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    memory_type VARCHAR(50) NOT NULL, -- e.g., 'preference', 'fact', 'style'
    memory_key VARCHAR(100) NOT NULL, -- e.g., 'response_style', 'favorite_activity'
    memory_value TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
