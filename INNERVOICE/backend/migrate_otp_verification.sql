-- =========================================================
-- INNERVOICE: OTP Verification Migration Script
-- Run this ONCE to add OTP verification fields to the users table.
-- All statements are safe to run multiple times (IF NOT EXISTS).
-- =========================================================

USE innervoice;

-- ── users ─────────────────────────────────────────────────
-- Add OTP verification fields to existing users table
-- These fields support email and phone number OTP verification

ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20) DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_otp_hash VARCHAR(255) DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_otp_expires_at DATETIME DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_otp_hash VARCHAR(255) DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_otp_expires_at DATETIME DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_otp_attempts INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_otp_attempts INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_otp_sent_at DATETIME DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_otp_sent_at DATETIME DEFAULT NULL;

-- Add unique constraint on phone_number if it doesn't already exist
ALTER TABLE users ADD UNIQUE INDEX IF NOT EXISTS idx_phone_number (phone_number);

-- Existing users remain usable without being forced through a new registration flow.
UPDATE users SET email_verified = TRUE, phone_verified = TRUE
WHERE email_otp_hash IS NULL AND phone_otp_hash IS NULL
	AND email_verified = FALSE AND phone_verified = FALSE;
