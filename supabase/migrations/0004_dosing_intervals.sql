-- 0004_dosing_intervals.sql
-- Phase 2: Dose interval, catch-up logic, and recurring vaccines

-- 1. Add overdue to schedule_item_status
ALTER TYPE public.schedule_item_status ADD VALUE IF NOT EXISTS 'overdue';

-- 2. Update vaccine_templates
ALTER TABLE public.vaccine_templates 
ADD COLUMN IF NOT EXISTS min_interval_days_from_prev integer,
ADD COLUMN IF NOT EXISTS recurrence_rule jsonb;

-- 3. Update member_vaccine_items
ALTER TABLE public.member_vaccine_items
ADD COLUMN IF NOT EXISTS min_interval_days_from_prev integer,
ADD COLUMN IF NOT EXISTS recurrence_rule jsonb;

-- 4. Seed sample intervals for infant vaccines (Hexa 1, 2, 3 usually 1 month apart)
UPDATE public.vaccine_templates SET min_interval_days_from_prev = 28 WHERE vaccine_name ILIKE '%Infanrix Hexa%Mũi 2%';
UPDATE public.vaccine_templates SET min_interval_days_from_prev = 28 WHERE vaccine_name ILIKE '%Infanrix Hexa%Mũi 3%';
UPDATE public.vaccine_templates SET min_interval_days_from_prev = 28 WHERE vaccine_name ILIKE '%Rotateq%Liều uống 2%';
UPDATE public.vaccine_templates SET min_interval_days_from_prev = 28 WHERE vaccine_name ILIKE '%Rotateq%Liều uống 3%';
UPDATE public.vaccine_templates SET min_interval_days_from_prev = 28 WHERE vaccine_name ILIKE '%Prevenar 13%Mũi 2%';
UPDATE public.vaccine_templates SET min_interval_days_from_prev = 28 WHERE vaccine_name ILIKE '%Prevenar 13%Mũi 3%';

-- 5. Seed recurrence for annual vaccines
UPDATE public.vaccine_templates SET recurrence_rule = '{"every_years": 1}' WHERE vaccine_name ILIKE '%Cúm mùa hàng năm%';
UPDATE public.vaccine_templates SET recurrence_rule = '{"every_years": 10}' WHERE vaccine_name ILIKE '%Tdap%' AND target_member_type = 'adult';
