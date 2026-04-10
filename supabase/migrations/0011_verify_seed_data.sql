-- 0011_verify_seed_data.sql
-- Phase 2/3: Verify and expand template seed data for adult, teen, senior, pregnant with intervals & recurrences

-- We will rewrite the adult, teen, senior, pregnancy templates with correct intervals.
-- First, we delete the basic placeholders from 0003 to insert a comprehensive verified set.
DELETE FROM public.vaccine_templates 
WHERE template_source IN ('vn_adult_v1', 'vn_teen_v1', 'vn_senior_v1', 'vn_pregnancy_v1', 'vn_child_v1');

-- vn_child_v1 (Trẻ em 4-15 tuổi)
INSERT INTO public.vaccine_templates (version, sort_order, milestone, recommended_age_days, recommended_age_label, vaccine_name, origin, disease, estimated_price, target_member_type, template_source, min_interval_days_from_prev)
VALUES\n('vn_child_v1', 1, 'Mốc 4 tuổi', 1460, '4 tuổi', 'MMR (Sởi-Quai bị-Rubella) nhắc lại', 'Mỹ/Bỉ', 'Sởi, Quai bị, Rubella', 350000, 'child', 'vn_child_v1', NULL),
('vn_child_v1', 2, 'Mốc 4 tuổi', 1467, '4 tuổi', 'Varivax (Thủy đậu) nhắc lại', 'Mỹ', 'Thủy đậu', 985000, 'child', 'vn_child_v1', NULL),
('vn_child_v1', 3, 'Khuyên dùng', 1460, 'Hàng năm', 'Cúm mùa (Trẻ em)', 'Pháp', 'Cúm mùa', 356000, 'child', 'vn_child_v1', NULL);

UPDATE public.vaccine_templates SET recurrence_rule = '{"every_years": 1}' WHERE version = 'vn_child_v1' AND vaccine_name LIKE 'Cúm mùa%';

-- vn_teen_v1 (Thiếu niên 9-18 tuổi)
INSERT INTO public.vaccine_templates (version, sort_order, milestone, recommended_age_days, recommended_age_label, vaccine_name, origin, disease, estimated_price, target_member_type, template_source, min_interval_days_from_prev)
VALUES 
('vn_teen_v1', 1, 'Mốc 9 tuổi (Nữ/Nam)', 3285, '9 tuổi', 'HPV (Ung thư CTC/Sùi mào gà) - Mũi 1', 'Mỹ', 'Ung thư cổ tử cung, Mụn cóc sinh dục', 1790000, 'teen', 'vn_teen_v1', NULL),
('vn_teen_v1', 2, 'Mốc 9 tuổi 6 tháng', 3465, '9 tuổi + 6 tháng', 'HPV (Ung thư CTC/Sùi mào gà) - Mũi 2', 'Mỹ', 'Ung thư cổ tử cung, Mụn cóc sinh dục', 1790000, 'teen', 'vn_teen_v1', 180),
('vn_teen_v1', 3, 'Mốc 11-12 tuổi', 4015, '11 tuổi', 'Tdap (Uốn ván, Bạch hầu, Ho gà)', 'Mỹ', 'Uốn ván, Bạch hầu, Ho gà', 650000, 'teen', 'vn_teen_v1', NULL),
('vn_teen_v1', 4, 'Mốc 11-12 tuổi', 4015, '11 tuổi', 'Não mô cầu ACYW', 'Mỹ', 'Viêm màng não do não mô cầu ACYW', 1950000, 'teen', 'vn_teen_v1', NULL);

-- vn_adult_v1 (Người lớn 19-64 tuổi)
INSERT INTO public.vaccine_templates (version, sort_order, milestone, recommended_age_days, recommended_age_label, vaccine_name, origin, disease, estimated_price, target_member_type, template_source, min_interval_days_from_prev)
VALUES 
('vn_adult_v1', 1, 'Theo dõi hàng năm', 0, 'Ngay khi join', 'Cúm mùa hàng năm', 'Pháp', 'Cúm mùa', 356000, 'adult', 'vn_adult_v1', NULL),
('vn_adult_v1', 2, 'Mỗi 10 năm', 0, 'Phác đồ 10 năm', 'Tdap / Td (Uốn ván, Bạch hầu, Ho gà)', 'Mỹ/Canda', 'Uốn ván, Bạch hầu, Ho gà', 650000, 'adult', 'vn_adult_v1', NULL),
('vn_adult_v1', 3, 'Chưa có miễn dịch', 0, 'Ngay khi join', 'Viêm gan B - Mũi 1', 'Hàn Quốc', 'Viêm gan B', 185000, 'adult', 'vn_adult_v1', NULL),
('vn_adult_v1', 4, 'Chưa có miễn dịch', 30, 'Sau Mũi 1 một tháng', 'Viêm gan B - Mũi 2', 'Hàn Quốc', 'Viêm gan B', 185000, 'adult', 'vn_adult_v1', 28),
('vn_adult_v1', 5, 'Chưa có miễn dịch', 180, 'Sau Mũi 1 sáu tháng', 'Viêm gan B - Mũi 3', 'Hàn Quốc', 'Viêm gan B', 185000, 'adult', 'vn_adult_v1', 150),
('vn_adult_v1', 6, 'Chưa có miễn dịch', 0, 'Lịch tuỳ chọn', 'MMR (Sởi-Quai bị-Rubella)', 'Mỹ/Bỉ', 'Sởi, Quai bị, Rubella', 350000, 'adult', 'vn_adult_v1', NULL);

UPDATE public.vaccine_templates SET recurrence_rule = '{"every_years": 1}' WHERE version = 'vn_adult_v1' AND vaccine_name LIKE 'Cúm mùa%';
UPDATE public.vaccine_templates SET recurrence_rule = '{"every_years": 10}' WHERE version = 'vn_adult_v1' AND vaccine_name LIKE 'Tdap%';

-- vn_senior_v1 (Người cao tuổi 65+)
INSERT INTO public.vaccine_templates (version, sort_order, milestone, recommended_age_days, recommended_age_label, vaccine_name, origin, disease, estimated_price, target_member_type, template_source, min_interval_days_from_prev)
VALUES 
('vn_senior_v1', 1, 'Ưu tiên', 0, 'Ngay khi join', 'Cúm mùa dòng cao tuổi', 'Pháp', 'Cúm mùa', 356000, 'senior', 'vn_senior_v1', NULL),
('vn_senior_v1', 2, 'Bảo vệ phổi', 0, 'Ngay khi join', 'Phế cầu (PCV13 / PPSV23)', 'Bỉ', 'Viêm phổi, Viêm màng não do phế cầu', 1190000, 'senior', 'vn_senior_v1', NULL),
('vn_senior_v1', 3, 'Ngừa Zona', 0, 'Ngay khi join', 'Shingrix (Zona thần kinh) - Mũi 1', 'Bỉ', 'Zona thần kinh (giời leo)', 1500000, 'senior', 'vn_senior_v1', NULL),
('vn_senior_v1', 4, 'Ngừa Zona', 60, '2-6 tháng sau Mũi 1', 'Shingrix (Zona thần kinh) - Mũi 2', 'Bỉ', 'Zona thần kinh', 1500000, 'senior', 'vn_senior_v1', 60);

UPDATE public.vaccine_templates SET recurrence_rule = '{"every_years": 1}' WHERE version = 'vn_senior_v1' AND vaccine_name LIKE 'Cúm mùa%';

-- vn_pregnancy_v1 (Phụ nữ mang thai)
INSERT INTO public.vaccine_templates (version, sort_order, milestone, recommended_age_days, recommended_age_label, vaccine_name, origin, disease, estimated_price, target_member_type, template_source, min_interval_days_from_prev)
VALUES 
('vn_pregnancy_v1', 1, 'Trước/trong thai kỳ', 0, 'Vào mùa', 'Cúm mùa (Bất hoạt)', 'Pháp', 'Cúm mùa', 356000, 'pregnant', 'vn_pregnancy_v1', NULL),
('vn_pregnancy_v1', 2, 'Tuần 27-36', 189, 'Thai 27-36 tuần', 'Tdap (Bạch hầu-Ho gà-Uốn ván)', 'Mỹ', 'Bảo vệ mẹ và kháng thể cho bé', 650000, 'pregnant', 'vn_pregnancy_v1', NULL),
('vn_pregnancy_v1', 3, 'Mũi cơ bản', 0, 'Tuỳ chọn/Cần thiết', 'Uốn ván (VAT) - Mũi 1', 'Việt Nam', 'Uốn ván (nếu chưa tiêm đủ)', 50000, 'pregnant', 'vn_pregnancy_v1', NULL),
('vn_pregnancy_v1', 4, 'Nhắc cơ bản', 30, 'Sau mũi 1 >1 tháng', 'Uốn ván (VAT) - Mũi 2', 'Việt Nam', 'Uốn ván (trước sinh 1 tháng)', 50000, 'pregnant', 'vn_pregnancy_v1', 28);
