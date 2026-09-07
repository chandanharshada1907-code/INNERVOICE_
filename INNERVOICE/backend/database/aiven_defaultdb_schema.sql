-- =========================================================
-- INNERVOICE — AIVEN MYSQL (defaultdb) PRODUCTION SCHEMA
-- Generated for direct import into Aiven MySQL 'defaultdb'
-- 
-- All statements use IF NOT EXISTS so it is safe to execute.
-- NO CREATE DATABASE or USE innervoice statements.
-- =========================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ─────────────────────────────────────────────
-- TABLE 1: users
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id                   INT AUTO_INCREMENT PRIMARY KEY,
    name                 VARCHAR(100) NOT NULL,
    email                VARCHAR(150) NOT NULL UNIQUE,
    password             VARCHAR(255) NOT NULL,
    role                 VARCHAR(50)  DEFAULT 'user',
    streak               INT          DEFAULT 0,
    xp                   INT          DEFAULT 0,
    level                INT          DEFAULT 1,
    phone_number         VARCHAR(20)  DEFAULT NULL,
    email_verified       BOOLEAN      DEFAULT FALSE,
    phone_verified       BOOLEAN      DEFAULT FALSE,
    email_otp_hash       VARCHAR(255) DEFAULT NULL,
    email_otp_expires_at DATETIME     DEFAULT NULL,
    email_otp_attempts   INT          DEFAULT 0,
    email_otp_sent_at    DATETIME     DEFAULT NULL,
    phone_otp_hash       VARCHAR(255) DEFAULT NULL,
    phone_otp_expires_at DATETIME     DEFAULT NULL,
    phone_otp_attempts   INT          DEFAULT 0,
    phone_otp_sent_at    DATETIME     DEFAULT NULL,
    created_at           TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- TABLE 2: moods
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS moods (
    mood_id    INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT          NOT NULL,
    mood       VARCHAR(50)  NOT NULL,
    mood_icon  VARCHAR(20)  DEFAULT '',
    mood_date  DATE         DEFAULT NULL,
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_mood_user_date (user_id, mood_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- TABLE 3: journals
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS journals (
    journal_id   INT AUTO_INCREMENT PRIMARY KEY,
    user_id      INT          NOT NULL,
    title        VARCHAR(255) DEFAULT '',
    content      TEXT         NOT NULL,
    journal_date DATE         DEFAULT NULL,
    created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_journal_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- TABLE 4: reflections
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reflections (
    reflection_id   INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT          NOT NULL,
    question        VARCHAR(255) DEFAULT '',
    answer          TEXT         NOT NULL,
    reflection_date DATE         DEFAULT NULL,
    created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_reflection_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- TABLE 5: goals
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS goals (
    goal_id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id          INT          NOT NULL,
    title            VARCHAR(255) NOT NULL,
    description      TEXT,
    category         VARCHAR(50)  DEFAULT 'General',
    priority         VARCHAR(20)  DEFAULT 'medium',
    target_value     INT          DEFAULT 1,
    current_progress INT          DEFAULT 0,
    tracking_type    VARCHAR(20)  DEFAULT 'manual',
    completed        BOOLEAN      DEFAULT FALSE,
    target_date      DATE         DEFAULT NULL,
    completed_date   DATE         DEFAULT NULL,
    created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_goals_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- TABLE 6: goal_milestones
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS goal_milestones (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    goal_id      INT          NOT NULL,
    title        VARCHAR(255) NOT NULL,
    target_value INT          NOT NULL,
    is_completed TINYINT(1)   DEFAULT 0,
    completed_at TIMESTAMP    NULL DEFAULT NULL,
    created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (goal_id) REFERENCES goals(goal_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- TABLE 7: goal_progress_history
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS goal_progress_history (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    goal_id        INT  NOT NULL,
    progress_value INT  NOT NULL,
    recorded_date  DATE NOT NULL,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (goal_id) REFERENCES goals(goal_id) ON DELETE CASCADE,
    UNIQUE KEY uq_goal_date (goal_id, recorded_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- TABLE 8: user_daily_challenges
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_daily_challenges (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    user_id          INT          NOT NULL,
    challenge_code   VARCHAR(100) DEFAULT NULL,
    title            VARCHAR(255) NOT NULL,
    description      TEXT,
    category         VARCHAR(50)  DEFAULT 'Mindfulness',
    difficulty       VARCHAR(20)  DEFAULT 'Easy',
    xp_reward        INT          DEFAULT 20,
    target_value     INT          DEFAULT 1,
    current_progress INT          DEFAULT 0,
    status           ENUM('available','in_progress','completed') DEFAULT 'available',
    challenge_date   DATE         NOT NULL,
    completed_at     TIMESTAMP    NULL DEFAULT NULL,
    created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uq_user_challenge_day (user_id, challenge_code, challenge_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- TABLE 9: achievements (master catalog)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS achievements (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    code        VARCHAR(50)  NOT NULL UNIQUE,
    name        VARCHAR(100) NOT NULL,
    description VARCHAR(255) NOT NULL,
    icon        VARCHAR(20)  NOT NULL,
    target      INT          NOT NULL DEFAULT 1,
    category    VARCHAR(50)  DEFAULT 'general',
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- TABLE 10: user_achievements (unlocked achievements)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_achievements (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    user_id        INT       NOT NULL,
    achievement_id INT       NOT NULL,
    unlocked_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_user_ach (user_id, achievement_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- TABLE 11: achievement_xp_transactions
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS achievement_xp_transactions (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT          NOT NULL,
    source_type VARCHAR(50)  NOT NULL,
    source_id   INT          DEFAULT NULL,
    xp_amount   INT          NOT NULL,
    description VARCHAR(255) DEFAULT '',
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uq_xp_source (user_id, source_type, source_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- TABLE 12: wellness_activity_log
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wellness_activity_log (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    user_id       INT          NOT NULL,
    activity_type VARCHAR(50)  NOT NULL,
    activity_name VARCHAR(100) DEFAULT '',
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_act (user_id, activity_type),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- TABLE 13: notifications
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    user_id      INT          NOT NULL,
    type         VARCHAR(50)  DEFAULT 'reminder',
    title        VARCHAR(200) NOT NULL,
    message      TEXT         NOT NULL,
    icon         VARCHAR(20)  DEFAULT '🔔',
    link         VARCHAR(100) DEFAULT '#dashboard',
    priority     VARCHAR(20)  DEFAULT 'low',
    reference_id VARCHAR(100) DEFAULT NULL,
    is_read      TINYINT(1)   DEFAULT 0,
    created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notif_user (user_id, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- TABLE 14: user_preferences
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_preferences (
    id                    INT AUTO_INCREMENT PRIMARY KEY,
    user_id               INT          NOT NULL UNIQUE,
    avatar                VARCHAR(100) DEFAULT '🌸',
    wellness_goals        TEXT,
    favorite_activities   TEXT,
    meditation_duration   INT          DEFAULT 5,
    breathing_exercise    VARCHAR(100) DEFAULT 'box',
    theme                 VARCHAR(50)  DEFAULT 'light',
    language              VARCHAR(50)  DEFAULT 'en',
    reminder_preference   VARCHAR(50)  DEFAULT 'none',
    created_at            TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- TABLE 15: chat_messages
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT              NOT NULL,
    role       ENUM('user','ai') NOT NULL,
    content    TEXT             NOT NULL,
    created_at TIMESTAMP        DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_chat_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- TABLE 16: voice_journals
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS voice_journals (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT          NOT NULL,
    transcript TEXT         NOT NULL,
    duration   VARCHAR(50)  DEFAULT '00:00',
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- TABLE 17: emotion_triggers
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS emotion_triggers (
    id        INT AUTO_INCREMENT PRIMARY KEY,
    name      VARCHAR(100) NOT NULL,
    category  VARCHAR(50)  DEFAULT 'Other',
    user_id   INT          DEFAULT NULL,
    is_custom BOOLEAN      DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Pre-populate default system-wide emotion triggers
INSERT IGNORE INTO emotion_triggers (name, category, user_id, is_custom) VALUES
    ('College / Studies', 'Education', NULL, FALSE),
    ('Work', 'Career', NULL, FALSE),
    ('Relationships', 'Social', NULL, FALSE),
    ('Family', 'Social', NULL, FALSE),
    ('Social interaction', 'Social', NULL, FALSE),
    ('Sleep', 'Health', NULL, FALSE),
    ('Exercise', 'Health', NULL, FALSE),
    ('Food', 'Health', NULL, FALSE),
    ('Personal achievement', 'Personal', NULL, FALSE),
    ('Financial concern', 'Finance', NULL, FALSE),
    ('Free time', 'Personal', NULL, FALSE),
    ('Health issue', 'Health', NULL, FALSE),
    ('Weather', 'Environment', NULL, FALSE),
    ('News / Social media', 'Environment', NULL, FALSE);

-- ─────────────────────────────────────────────
-- TABLE 18: mood_triggers
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mood_triggers (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    mood_id      INT  NOT NULL,
    trigger_id   INT  NOT NULL,
    context_note TEXT,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mood_id) REFERENCES moods(mood_id) ON DELETE CASCADE,
    FOREIGN KEY (trigger_id) REFERENCES emotion_triggers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- TABLE 19: focus_sessions
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS focus_sessions (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    user_id      INT          NOT NULL,
    task_name    VARCHAR(255) DEFAULT 'Focus Session',
    duration     INT          NOT NULL,
    completed    BOOLEAN      DEFAULT TRUE,
    started_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP    NULL DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- TABLE 20: ai_memory
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_memory (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    user_id      INT          NOT NULL,
    memory_type  VARCHAR(50)  NOT NULL,
    memory_key   VARCHAR(100) NOT NULL,
    memory_value TEXT         NOT NULL,
    created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_user_key (user_id, memory_key),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- TABLE 21: habits
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS habits (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    user_id        INT          NOT NULL,
    name           VARCHAR(255) NOT NULL,
    description    TEXT,
    category       VARCHAR(50)  DEFAULT 'Wellness',
    frequency_type ENUM('daily','weekly','specific_days') DEFAULT 'daily',
    target_count   INT          DEFAULT 1,
    preferred_time VARCHAR(50),
    color          VARCHAR(20),
    active         BOOLEAN      DEFAULT TRUE,
    created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_habits_user (user_id, active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- TABLE 22: habit_completions
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS habit_completions (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    habit_id        INT  NOT NULL,
    user_id         INT  NOT NULL,
    completion_date DATE NOT NULL,
    completed       BOOLEAN      DEFAULT TRUE,
    notes           TEXT,
    completed_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
    UNIQUE KEY uq_habit_date (habit_id, completion_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- TABLE 23: wellness_scores
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wellness_scores (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    user_id       INT          NOT NULL,
    score         INT          NOT NULL,
    change_reason VARCHAR(255) DEFAULT 'Calculated based on daily activity.',
    score_date    DATE         NOT NULL,
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uq_score_user_date (user_id, score_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- TABLE 24: daily_plans
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_plans (
    id                    INT AUTO_INCREMENT PRIMARY KEY,
    user_id               INT          NOT NULL,
    plan_date             DATE         NOT NULL,
    wellness_score        INT          DEFAULT 0,
    primary_focus         VARCHAR(255) NOT NULL DEFAULT 'General Wellness',
    plan_summary          TEXT,
    completion_percentage INT          DEFAULT 0,
    created_at            TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_plan_user_date (user_id, plan_date),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- TABLE 25: daily_plan_items
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_plan_items (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    daily_plan_id     INT          NOT NULL,
    user_id           INT          NOT NULL,
    activity_type     VARCHAR(50)  NOT NULL,
    title             VARCHAR(255) NOT NULL,
    description       TEXT,
    priority          ENUM('HIGH','MEDIUM','LOW') DEFAULT 'MEDIUM',
    estimated_minutes INT          DEFAULT 5,
    reason            TEXT,
    completed         BOOLEAN      DEFAULT FALSE,
    skipped           BOOLEAN      DEFAULT FALSE,
    completed_at      TIMESTAMP    NULL,
    created_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (daily_plan_id) REFERENCES daily_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- Seed default achievement catalog
-- ─────────────────────────────────────────────
INSERT IGNORE INTO achievements (code, name, description, icon, target, category) VALUES
    ('first_mood',       'First Feeling',        'Log your very first mood',                       '😊', 1,  'mood'),
    ('mood_7',           'Week of Feelings',     'Log mood 7 days in a row',                       '🌈', 7,  'mood'),
    ('mood_30',          'Mood Master',          'Log mood for 30 days',                           '🏆', 30, 'mood'),
    ('first_journal',    'Dear Diary',           'Write your first journal entry',                  '📔', 1,  'journal'),
    ('journal_10',       'Reflective Mind',      'Write 10 journal entries',                        '✍️', 10, 'journal'),
    ('first_goal',       'Goal Setter',          'Create your first goal',                          '🎯', 1,  'goal'),
    ('goals_5',          'Achiever',             'Complete 5 goals',                                '⭐', 5,  'goal'),
    ('streak_3',         'Three-Day Streak',     'Maintain a 3-day wellness streak',                '🔥', 3,  'streak'),
    ('streak_7',         'Week Warrior',         'Maintain a 7-day wellness streak',                '💪', 7,  'streak'),
    ('streak_30',        'Monthly Champion',     'Maintain a 30-day wellness streak',               '👑', 30, 'streak'),
    ('first_reflection', 'Inner Voice',          'Complete your first self-reflection',             '🪞', 1,  'reflection'),
    ('first_chat',       'Wellness Chat',        'Have your first chat with the AI assistant',      '🤖', 1,  'chat'),
    ('xp_100',           'XP Milestone',         'Earn 100 XP through wellness activities',         '⚡', 100,'xp'),
    ('xp_500',           'XP Champion',          'Earn 500 XP through wellness activities',         '💫', 500,'xp');

SET FOREIGN_KEY_CHECKS = 1;

