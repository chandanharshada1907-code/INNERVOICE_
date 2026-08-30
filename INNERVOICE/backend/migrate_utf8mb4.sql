-- =========================================================
-- INNERVOICE: UTF8MB4 Migration
-- Run this ONCE to fix emoji storage for moods, chat, etc.
-- Converts the database and key columns to utf8mb4 so
-- emoji icons (😊 😄 🎯) are stored/retrieved correctly.
-- =========================================================

USE innervoice;

-- 1. Convert database default charset
ALTER DATABASE innervoice CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. Fix moods table (mood_icon/icon column must support emoji)
ALTER TABLE moods
    CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 3. Fix users table
ALTER TABLE users
    CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 4. Fix journals
ALTER TABLE journals
    CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 5. Fix reflections
ALTER TABLE reflections
    CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 6. Fix goals
ALTER TABLE goals
    CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 7. Fix notifications
ALTER TABLE notifications
    CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 8. Fix chat_messages (if exists)
ALTER TABLE chat_messages
    CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 9. Fix user_preferences (if exists)
ALTER TABLE user_preferences
    CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 10. Fix emotion_triggers (if exists)
ALTER TABLE emotion_triggers
    CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 11. Fix mood_triggers (if exists)
ALTER TABLE mood_triggers
    CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

SELECT 'UTF8MB4 migration complete!' AS status;
