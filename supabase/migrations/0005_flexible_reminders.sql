-- 0005_flexible_reminders.sql
-- Phase 2: Flexible reminder windows

ALTER TABLE public.reminder_preferences 
ADD COLUMN IF NOT EXISTS reminder_offsets jsonb NOT NULL DEFAULT '[{"days": 1}, {"hours": 2}]'::jsonb;

-- Sync existing bools to jsonb if not already set
UPDATE public.reminder_preferences 
SET reminder_offsets = (
    CASE 
        WHEN remind_one_day = true AND remind_two_hours = true THEN '[{"days": 1}, {"hours": 2}]'::jsonb
        WHEN remind_one_day = true AND remind_two_hours = false THEN '[{"days": 1}]'::jsonb
        WHEN remind_one_day = false AND remind_two_hours = true THEN '[{"hours": 2}]'::jsonb
        ELSE '[]'::jsonb
    END
)
WHERE reminder_offsets = '[{"days": 1}, {"hours": 2}]'::jsonb; -- only update if still at default

-- Note: We keep the old bool columns for backward compatibility in this phase, 
-- but the cron logic should prioritize reminder_offsets.
