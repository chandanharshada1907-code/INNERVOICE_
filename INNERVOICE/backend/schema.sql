-- INNERVOICE Database Schema (Extended)
-- This reflects the actual column names used by all backend routes.
-- Run this for a FRESH database setup.
-- For an EXISTING database created from the old schema, run migrate.sql instead.

CREATE DATABASE IF NOT EXISTS innervoice
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;
USE innervoice;

-- Users table (register / login)
CREATE TABLE IF NOT EXISTS users (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    email      VARCHAR(150) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,
    streak     INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mood entries
CREATE TABLE IF NOT EXISTS moods (
    mood_id    INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT          NOT NULL,
    mood       VARCHAR(50)  NOT NULL,
    mood_icon  VARCHAR(20),
    mood_date  DATE         DEFAULT NULL,
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Journal entries
CREATE TABLE IF NOT EXISTS journals (
    journal_id   INT AUTO_INCREMENT PRIMARY KEY,
    user_id      INT          NOT NULL,
    title        VARCHAR(255) DEFAULT '',
    content      TEXT         NOT NULL,
    journal_date DATE         DEFAULT NULL,
    created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Self-reflection entries
CREATE TABLE IF NOT EXISTS reflections (
    reflection_id   INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT          NOT NULL,
    question        VARCHAR(255),
    answer          TEXT         NOT NULL DEFAULT '',
    reflection_date DATE         DEFAULT NULL,
    created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Daily challenge / goals
CREATE TABLE IF NOT EXISTS goals (
    goal_id      INT AUTO_INCREMENT PRIMARY KEY,
    user_id      INT          NOT NULL,
    title        VARCHAR(255) NOT NULL,
    description  TEXT         DEFAULT '',
    category     VARCHAR(50)  DEFAULT 'General',
    priority     VARCHAR(20)  DEFAULT 'medium',
    target_value INT          DEFAULT 1,
    current_progress INT      DEFAULT 0,
    tracking_type VARCHAR(20) DEFAULT 'manual',
    completed    BOOLEAN      DEFAULT FALSE,
    target_date  DATE         DEFAULT NULL,
    completed_date DATE       DEFAULT NULL,
    created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS goal_milestones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    goal_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    target_value INT NOT NULL,
    is_completed TINYINT(1) DEFAULT 0,
    completed_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (goal_id) REFERENCES goals(goal_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS goal_progress_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    goal_id INT NOT NULL,
    progress_value INT NOT NULL,
    recorded_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (goal_id) REFERENCES goals(goal_id) ON DELETE CASCADE,
    UNIQUE KEY (goal_id, recorded_date)
);

-- Achievements
CREATE TABLE IF NOT EXISTS achievements (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    code        VARCHAR(50)  NOT NULL UNIQUE,
    name        VARCHAR(100) NOT NULL,
    description VARCHAR(255) NOT NULL,
    icon        VARCHAR(20)  NOT NULL,
    target      INT          NOT NULL DEFAULT 1,
    category    VARCHAR(50)  DEFAULT 'general',
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- User Achievements
CREATE TABLE IF NOT EXISTS user_achievements (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    user_id        INT       NOT NULL,
    achievement_id INT       NOT NULL,
    unlocked_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_user_ach (user_id, achievement_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE
);

-- Wellness Activity Log
CREATE TABLE IF NOT EXISTS wellness_activity_log (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    user_id       INT          NOT NULL,
    activity_type VARCHAR(50)  NOT NULL,
    activity_name VARCHAR(100) DEFAULT '',
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_act (user_id, activity_type),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT          NOT NULL,
    type        VARCHAR(50)  DEFAULT 'reminder',
    title       VARCHAR(200) NOT NULL,
    message     TEXT         NOT NULL,
    icon        VARCHAR(20)  DEFAULT '🔔',
    link        VARCHAR(100) DEFAULT '#dashboard',
    priority    VARCHAR(20)  DEFAULT 'low',
    reference_id VARCHAR(100) DEFAULT NULL,
    is_read     TINYINT(1)   DEFAULT 0,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User Preferences (for recommendations and profile)
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id               INT PRIMARY KEY,
    wellness_goals        TEXT,
    favorite_activities   TEXT,
    meditation_duration   INT DEFAULT 5,
    breathing_exercise    VARCHAR(50) DEFAULT 'box',
    theme                 VARCHAR(50) DEFAULT 'light',
    language              VARCHAR(10) DEFAULT 'en',
    reminder_preference   VARCHAR(50) DEFAULT 'none',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT          NOT NULL,
    role       ENUM('user','ai') NOT NULL,
    content    TEXT         NOT NULL,
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

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
