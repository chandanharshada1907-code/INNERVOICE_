-- =========================================================
-- INNERVOICE: Migration Script
-- Run this ONCE to upgrade an existing database created from
-- the original schema.sql to the extended schema used by routes.
-- All statements are safe to run multiple times (IF NOT EXISTS
-- or IGNORE errors on ALTER).
-- =========================================================

USE innervoice;

-- ── moods ─────────────────────────────────────────────────
-- Rename PK alias: routes expect mood_id as the PK column name
-- Routes SELECT mood_id, mood_icon, mood_date
ALTER TABLE moods CHANGE COLUMN id mood_id INT AUTO_INCREMENT;
ALTER TABLE moods CHANGE COLUMN icon mood_icon VARCHAR(20);

-- Add mood_date if missing
ALTER TABLE moods ADD COLUMN IF NOT EXISTS mood_date DATE DEFAULT NULL;
-- Backfill mood_date from created_at for existing rows
UPDATE moods SET mood_date = DATE(created_at) WHERE mood_date IS NULL;

-- ── journals ──────────────────────────────────────────────
-- Routes expect: journal_id, title, content, journal_date
ALTER TABLE journals CHANGE COLUMN id journal_id INT AUTO_INCREMENT;
ALTER TABLE journals CHANGE COLUMN text content TEXT NOT NULL;

-- Add title if missing
ALTER TABLE journals ADD COLUMN IF NOT EXISTS title VARCHAR(255) DEFAULT '';
-- Add journal_date if missing
ALTER TABLE journals ADD COLUMN IF NOT EXISTS journal_date DATE DEFAULT NULL;
-- Add created_at if missing (it already exists, but just in case)
UPDATE journals SET journal_date = DATE(created_at) WHERE journal_date IS NULL;

-- ── reflections ───────────────────────────────────────────
-- Routes expect: reflection_id, question, answer, reflection_date
ALTER TABLE reflections CHANGE COLUMN id reflection_id INT AUTO_INCREMENT;

-- Add reflection_date if missing
ALTER TABLE reflections ADD COLUMN IF NOT EXISTS reflection_date DATE DEFAULT NULL;
UPDATE reflections SET reflection_date = DATE(created_at) WHERE reflection_date IS NULL;

-- ── goals ─────────────────────────────────────────────────
-- Routes expect: goal_id, title, description, target_date, completed, created_at
-- schema.sql has: id, challenge, completed_date
ALTER TABLE goals CHANGE COLUMN id goal_id INT AUTO_INCREMENT;

-- Add title (migrate from challenge)
ALTER TABLE goals ADD COLUMN IF NOT EXISTS title VARCHAR(255) DEFAULT '';
UPDATE goals SET title = challenge WHERE title = '' OR title IS NULL;

-- Add description
ALTER TABLE goals ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';

-- Add target_date (migrate from completed_date)
ALTER TABLE goals ADD COLUMN IF NOT EXISTS target_date DATE DEFAULT NULL;
UPDATE goals SET target_date = completed_date WHERE target_date IS NULL;

-- Add created_at
ALTER TABLE goals ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
