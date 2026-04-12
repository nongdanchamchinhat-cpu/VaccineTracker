-- 0006_phase2_backfill.sql
-- Phase 2: backfill interval and recurrence metadata after schema migrations 0004/0005

UPDATE public.vaccine_templates
SET min_interval_days_from_prev = CASE
  WHEN version = 'vn_default_v1' AND sort_order = 2 THEN 7
  WHEN version = 'vn_default_v1' AND sort_order = 3 THEN 7
  WHEN version = 'vn_default_v1' AND sort_order = 4 THEN 7
  WHEN version = 'vn_default_v1' AND sort_order = 5 THEN 7
  WHEN version = 'vn_default_v1' AND sort_order = 6 THEN 9
  WHEN version = 'vn_default_v1' AND sort_order = 7 THEN 7
  WHEN version = 'vn_default_v1' AND sort_order = 8 THEN 7
  WHEN version = 'vn_default_v1' AND sort_order = 9 THEN 19
  WHEN version = 'vn_default_v1' AND sort_order = 10 THEN 7
  WHEN version = 'vn_default_v1' AND sort_order = 11 THEN 7
  WHEN version = 'vn_default_v1' AND sort_order = 12 THEN 7
  WHEN version = 'vn_default_v1' AND sort_order = 13 THEN 7
  WHEN version = 'vn_default_v1' AND sort_order = 14 THEN 28
  WHEN version = 'vn_default_v1' AND sort_order = 15 THEN 7
  WHEN version = 'vn_default_v1' AND sort_order = 16 THEN 21
  WHEN version = 'vn_default_v1' AND sort_order = 17 THEN 63
  WHEN version = 'vn_default_v1' AND sort_order = 18 THEN 91
  WHEN version = 'vn_default_v1' AND sort_order = 19 THEN 7
  WHEN version = 'vn_default_v1' AND sort_order = 20 THEN 7
  WHEN version = 'vn_default_v1' AND sort_order = 21 THEN 7
  WHEN version = 'vn_default_v1' AND sort_order = 22 THEN 7
  WHEN version = 'vn_default_v1' AND sort_order = 23 THEN 7
  WHEN version = 'vn_default_v1' AND sort_order = 24 THEN 7
  WHEN version = 'vn_teen_v1' AND sort_order = 2 THEN 180
  ELSE min_interval_days_from_prev
END;

UPDATE public.vaccine_templates
SET recurrence_rule = '{"every_years":1}'::jsonb
WHERE vaccine_name ILIKE '%Cúm mùa%';

UPDATE public.vaccine_templates
SET recurrence_rule = '{"every_years":10}'::jsonb
WHERE vaccine_name ILIKE '%Tdap%';

UPDATE public.member_vaccine_items items
SET
  min_interval_days_from_prev = templates.min_interval_days_from_prev,
  recurrence_rule = templates.recurrence_rule
FROM public.vaccine_templates templates
WHERE items.template_entry_id = templates.id
  AND (
    items.min_interval_days_from_prev IS DISTINCT FROM templates.min_interval_days_from_prev
    OR items.recurrence_rule IS DISTINCT FROM templates.recurrence_rule
  );
