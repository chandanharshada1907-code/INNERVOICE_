-- Migration for Phase 15: Weekly Wellness Insights
ALTER TABLE daily_plan_items ADD COLUMN IF NOT EXISTS skipped BOOLEAN DEFAULT FALSE;
