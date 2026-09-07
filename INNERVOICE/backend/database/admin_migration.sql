-- =========================================================
-- INNERVOICE Admin Dashboard Migration
-- Adds `role` column to existing `users` table.
-- Safe to run multiple times (uses IF NOT EXISTS pattern).
--
-- Run in phpMyAdmin or MySQL CLI:
--   mysql -u root -p innervoice < admin_migration.sql
--
-- After running, promote your admin account:
--   UPDATE users SET role = 'admin' WHERE email = 'your-admin@example.com';
-- =========================================================

USE innervoice;

-- Add role column only if it doesn't already exist
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS role ENUM('user', 'admin') NOT NULL DEFAULT 'user'
    COMMENT 'User role: user = normal user, admin = administrator';

-- Verify (optional — you can run this to check):
-- SELECT id, name, email, role, created_at FROM users ORDER BY created_at;
