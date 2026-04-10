-- 0003_family_members.sql
-- Goal: Pivot from Kobe Tracker (children only) to Family Vaccine Tracker (all ages)

-- 1. Create member_type enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'member_type') THEN
        CREATE TYPE public.member_type AS ENUM ('infant', 'child', 'teen', 'adult', 'senior', 'pregnant');
    END IF;
END $$;

-- 2. Rename tables
ALTER TABLE IF EXISTS public.children RENAME TO family_members;
ALTER TABLE IF EXISTS public.child_vaccine_items RENAME TO member_vaccine_items;

-- 3. Update family_members table
ALTER TABLE public.family_members ADD COLUMN IF NOT EXISTS member_type public.member_type NOT NULL DEFAULT 'infant';

-- 4. Update vaccine_templates table
ALTER TABLE public.vaccine_templates ADD COLUMN IF NOT EXISTS target_member_type public.member_type NOT NULL DEFAULT 'infant';

-- 5. Rename Foreign Key columns and update references
-- Note: Postgres usually renames FK columns if the table is renamed, but here we are renaming the column itself within the table.
-- First, handle member_vaccine_items (formerly child_vaccine_items)
ALTER TABLE public.member_vaccine_items RENAME COLUMN child_id TO member_id;

-- Second, handle reminder_preferences
ALTER TABLE public.reminder_preferences RENAME COLUMN child_id TO member_id;

-- Third, handle notification_deliveries
ALTER TABLE public.notification_deliveries RENAME COLUMN child_id TO member_id;
ALTER TABLE public.notification_deliveries RENAME COLUMN child_vaccine_item_id TO member_vaccine_item_id;

-- 6. Update RLS policies
-- children_own_all -> family_members_own_all
DROP POLICY IF EXISTS "children_own_all" ON public.family_members;
CREATE POLICY "family_members_own_all"
  ON public.family_members
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- schedule_items_own_all (update to use member_id and renamed table)
DROP POLICY IF EXISTS "schedule_items_own_all" ON public.member_vaccine_items;
CREATE POLICY "member_vaccine_items_own_all"
  ON public.member_vaccine_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.family_members
      WHERE family_members.id = member_vaccine_items.member_id
        AND family_members.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.family_members
      WHERE family_members.id = member_vaccine_items.member_id
        AND family_members.user_id = auth.uid()
    )
  );

-- reminder_preferences_own_all
DROP POLICY IF EXISTS "reminder_preferences_own_all" ON public.reminder_preferences;
CREATE POLICY "reminder_preferences_own_all"
  ON public.reminder_preferences
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.family_members
      WHERE family_members.id = reminder_preferences.member_id
        AND family_members.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.family_members
      WHERE family_members.id = reminder_preferences.member_id
        AND family_members.user_id = auth.uid()
    )
  );

-- notification_deliveries_read_own
DROP POLICY IF EXISTS "notification_deliveries_read_own" ON public.notification_deliveries;
CREATE POLICY "notification_deliveries_read_own"
  ON public.notification_deliveries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.family_members
      WHERE family_members.id = notification_deliveries.member_id
        AND family_members.user_id = auth.uid()
    )
  );

-- 7. Rename Triggers (optional but cleaner)
ALTER TRIGGER children_set_updated_at ON public.family_members RENAME TO family_members_set_updated_at;
ALTER TRIGGER child_vaccine_items_set_updated_at ON public.member_vaccine_items RENAME TO member_vaccine_items_set_updated_at;

-- 8. Seed additional templates for other member types
-- vn_adult_v1
INSERT INTO public.vaccine_templates (version, sort_order, milestone, recommended_age_days, recommended_age_label, vaccine_name, origin, disease, estimated_price, target_member_type)
VALUES 
('vn_adult_v1', 1, 'Ưu tiên ngay khi đăng ký', 0, 'Ngay khi join', 'Cúm mùa hàng năm (v1)', 'Pháp', 'Cúm mùa', 356000, 'adult'),
('vn_adult_v1', 2, 'Ưu tiên ngay khi đăng ký', 0, 'Ngay khi join', 'Tdap (Bạch hầu-Ho gà-Uốn ván)', 'Mỹ', 'Uốn ván, Bạch hầu, Ho gà', 650000, 'adult'),
('vn_adult_v1', 3, 'Ưu tiên ngay khi đăng ký', 0, 'Ngay khi join', 'Viêm gan B (nếu chưa tiêm)', 'Hàn Quốc', 'Viêm gan B', 185000, 'adult');

-- vn_child_v1
INSERT INTO public.vaccine_templates (version, sort_order, milestone, recommended_age_days, recommended_age_label, vaccine_name, origin, disease, estimated_price, target_member_type)
VALUES
('vn_child_v1', 1, 'Mốc 4 tuổi', 1460, '4 tuổi', 'MMR (Sởi-Quai bị-Rubella) nhắc lại', 'Mỹ/Bỉ', 'Sởi, Quai bị, Rubella', 350000, 'child'),
('vn_child_v1', 2, 'Mốc 4 tuổi', 1467, '4 tuổi + 1 tuần', 'Varivax (Thủy đậu) nhắc lại', 'Mỹ', 'Thủy đậu', 985000, 'child');

-- vn_teen_v1
INSERT INTO public.vaccine_templates (version, sort_order, milestone, recommended_age_days, recommended_age_label, vaccine_name, origin, disease, estimated_price, target_member_type)
VALUES 
('vn_teen_v1', 1, 'Mốc 9 tuổi', 3285, '9 tuổi', 'HPV (Ung thư CTC) - Mũi 1', 'Mỹ', 'Ung thư cổ tử cung, Mụn cóc sinh dục', 1790000, 'teen'),
('vn_teen_v1', 2, 'Mốc 9 tuổi 6 tháng', 3465, '9 tuổi + 6 tháng', 'HPV (Ung thư CTC) - Mũi 2', 'Mỹ', 'Ung thư cổ tử cung, Mụn cóc sinh dục', 1790000, 'teen');

-- vn_senior_v1
INSERT INTO public.vaccine_templates (version, sort_order, milestone, recommended_age_days, recommended_age_label, vaccine_name, origin, disease, estimated_price, target_member_type)
VALUES 
('vn_senior_v1', 1, 'Ưu tiên ngay khi đăng ký', 0, 'Ngay khi join', 'Phế cầu (PCV13)', 'Bỉ', 'Viêm phổi, Viêm màng não do phế cầu', 1190000, 'senior'),
('vn_senior_v1', 2, 'Ưu tiên ngay khi đăng ký', 0, 'Ngay khi join', 'Cúm mùa hàng năm', 'Pháp', 'Cúm mùa', 356000, 'senior');

-- vn_pregnancy_v1
INSERT INTO public.vaccine_templates (version, sort_order, milestone, recommended_age_days, recommended_age_label, vaccine_name, origin, disease, estimated_price, target_member_type)
VALUES 
('vn_pregnancy_v1', 1, 'Tuần 27-36', 0, 'Khi mang thai', 'Tdap (Uốn ván-Bạch hầu-Ho gà)', 'Mỹ', 'Uốn ván, Ho gà cho trẻ sơ sinh', 650000, 'pregnant');
