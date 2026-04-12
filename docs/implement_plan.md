Plan: Pivot Kobe Tracker → Family Vaccine Tracker
Nguồn: Plan này được sinh ra từ kết quả scan branch claude/analyze-vaccination-app-G1osN. Một số file/tham chiếu dòng có thể đã khác trên staging (guest mode, migration 0002 sync templates…). Trước khi implement từng phase, kiểm tra lại file path và số dòng trên nhánh đích.

Context
App hiện tại là Kobe Tracker — sổ tiêm chủng Next.js + Supabase chỉ dành cho em bé (bảng children, template vn_default_v1 cover 23 mũi từ 2-13 tháng tuổi). Mục tiêu mới: mở rộng thành web app nhắc tiêm cho cả gia đình (em bé, trẻ em, thiếu niên, người lớn, người cao tuổi, phụ nữ mang thai).

Quyết định của product owner:

Schema pivot: Rename children → family_members + thêm member_type (clean long-term).
Chiến lược: MVP family pivot trước, các phần còn lại (sharing, PWA, calendar view…) sau.
Notification: Giữ email only, không thêm kênh mới ở các phase này.
Sharing: Để ở giai đoạn sau (Phase 3+).
Kết quả mong muốn: sau Phase 1, user có thể tạo nhiều thành viên với loại khác nhau và mỗi loại được sinh lịch tiêm phù hợp với độ tuổi; không có breaking change với data hiện có.

Phase 0 — Dọn dẹp & nền tảng chất lượng (quick wins)
Mục tiêu: Giải quyết các rủi ro/leak rẻ nhất trước khi refactor lớn.

Xoá file prototype không dùng
index.html (~35KB, prototype cũ)
kobe-tracker-v2.jsx (~32KB, prototype cũ)
Sửa leak path cá nhân trong README (README.md:37): bỏ /Users/alvin/Desktop/App tiêm chủng/…, dùng đường dẫn tương đối supabase/migrations/0001_init.sql.
Fix cron race/miss window (src/app/api/cron/reminders/route.ts:25,62-65):
Bỏ logic dueAt > windowStart && dueAt <= now (fragile nếu cron miss tick).
Thay bằng: pre-insert notification_deliveries ở trạng thái pending với scheduled_for khi tạo/sửa schedule item, cron chỉ claim các dòng status='pending' AND scheduled_for <= now().
Giữ nguyên unique index chống trùng.
Fix label UI lộ kỹ thuật (src/components/dashboard-app.tsx:697,777-779): "planned" → "Sắp tiêm".
Thêm Vitest + 1 smoke test cho buildScheduleFromTemplates (để có chỗ viết test cho Phase 1+).
Files critical: README.md, src/app/api/cron/reminders/route.ts, src/components/dashboard-app.tsx, package.json (thêm vitest), vitest.config.ts (mới).

Phase 1 — Family pivot MVP (ưu tiên cao nhất)
Mục tiêu: App hỗ trợ thành viên gia đình thuộc mọi nhóm tuổi; template được chọn theo member_type.

1.1 Migration SQL (supabase/migrations/0002_family_members.sql — mới)
Rename bảng: children → family_members; child_vaccine_items → member_vaccine_items.
Rename FK: child_id → member_id ở member_vaccine_items, reminder_preferences, notification_deliveries.
Thêm enum member_type: infant | child | teen | adult | senior | pregnant.
Thêm cột family_members.member_type member_type NOT NULL DEFAULT 'infant' (default để data cũ không vỡ).
Thêm cột vaccine_templates.target_member_type member_type NOT NULL DEFAULT 'infant'.
Rename RLS policies (children_own_all → family_members_own_all, schedule_items_own_all vẫn giữ nhưng update join).
Rename trigger + indexes tương ứng.
Seed thêm templates cho các nhóm còn lại (xem 1.2).
Lưu ý: trên staging đã có migration 0002_sync_vaccine_templates_from_excel.sql. Đặt file này thành 0003_family_members.sql nếu merge vào staging.

1.2 Mở rộng template library
Thêm vào cùng migration, seed vào bảng vaccine_templates:

vn_adult_v1 (adult 19-64): cúm mùa hàng năm, Tdap booster, viêm gan B (nếu chưa), HPV (nữ ≤26), MMR catch-up, thuỷ đậu catch-up, COVID, não mô cầu.
vn_teen_v1 (9-18): HPV 2-3 mũi, Tdap 11-12 tuổi, não mô cầu ACYW 11-16, cúm hàng năm.
vn_senior_v1 (65+): phế cầu (PCV13 + PPSV23), zona (Shingrix), cúm hàng năm, Tdap 10 năm/lần.
vn_pregnancy_v1: Tdap tuần 27-36, cúm mùa, viêm gan B (nếu chưa).
Mỗi dòng vẫn dùng recommended_age_days nhưng với context mới: với infant thì tính từ ngày sinh; với nhóm khác thì recommended_age_days = 0 nghĩa là "tiêm ngay khi join" — logic sinh lịch sẽ đổi (xem 1.4).

1.3 Rename TypeScript + API layer
Types (src/lib/types.ts):

ChildProfile → FamilyMember, thêm member_type: MemberType.
ScheduleItem.child_id → member_id.
ReminderPreferences.child_id → member_id.
NotificationDelivery.child_id → member_id.
DashboardBootstrapData.children/selectedChild → members/selectedMember.
API routes rename (App Router folder rename):

src/app/api/children/ → src/app/api/family-members/
src/app/api/me/children/ → src/app/api/me/family-members/
Body field child_id → member_id (schedule-items, reminder-preferences).
DB helpers (src/lib/db.ts):

getOwnedChild → getOwnedMember.
loadDashboardData: query family_members thay vì children; select cũng phải join member_vaccine_items bằng member_id.
buildScheduleFromTemplates(child, templates) → buildScheduleFromTemplates(member, templates).
Cron (src/app/api/cron/reminders/route.ts): join family_members thay vì children; rename biến child → member.

ICS export (src/lib/ics.ts, src/app/api/children/[id]/calendar.ics/route.ts): đổi path + label "Tiêm chủng cho ${childName}" → "Tiêm chủng cho ${memberName}".

Email (src/lib/email.ts): prop childName → memberName.

1.4 Logic sinh lịch theo member_type
Ở src/lib/db.ts buildScheduleFromTemplates:

Nhận thêm memberType: MemberType (đã có trên member).
Query templates theo target_member_type = memberType (thay vì hardcode vn_default_v1).
Với infant/child/teen: giữ logic hiện tại birth_date + recommended_age_days.
Với adult/senior/pregnant: tính từ ngày join/ngày bắt đầu tính (member.created_at hoặc start_date — thêm cột start_date date optional); template với recommended_age_days=0 sẽ lên lịch ngay ngày join.
Recurring (cúm hàng năm, tetanus 10 năm) không nằm trong Phase 1 — đánh dấu TODO, để Phase 2 xử lý.
src/app/api/family-members/[id]/schedule/from-template/route.ts (rename từ children/[id]/schedule/from-template): bỏ hardcode DEFAULT_TEMPLATE_VERSION, chọn version theo member.member_type.

1.5 UI dashboard (src/components/dashboard-app.tsx)
"Hồ sơ bé" → "Thành viên gia đình".
Form tạo: thêm dropdown member_type (6 lựa chọn VN hoá: "Sơ sinh / Trẻ em / Thiếu niên / Người lớn / Cao tuổi / Mang thai").
Switcher hiển thị badge member_type trên mỗi chip member.
Mô tả tiêu đề: "Quản lý lịch tiêm cho cả gia đình".
Label "planned" đã sửa ở Phase 0.
Không tách file component ở phase này (giữ 1 file, để Phase 3 refactor kỹ).
Trên staging còn có guest-dashboard-app.tsx — áp dụng rename tương tự để consistent.
1.6 Smoke test tối thiểu (Vitest)
Dùng test harness đã thêm ở Phase 0:

buildScheduleFromTemplates sinh đúng số mũi cho infant từ ngày sinh (giữ behavior cũ).
buildScheduleFromTemplates với adult dùng start_date thay vì birth_date.
Query template đúng target_member_type.
Critical files Phase 1:

supabase/migrations/000X_family_members.sql (mới, X tuỳ branch đích)
src/lib/types.ts
src/lib/db.ts
src/lib/constants.ts (bỏ DEFAULT_TEMPLATE_VERSION)
src/lib/email.ts, src/lib/ics.ts, src/lib/reminders.ts
src/app/api/family-members/** (rename từ children/**)
src/app/api/me/family-members/** (rename)
src/app/api/schedule-items/** (đổi field trong body schema)
src/app/api/me/reminder-preferences/route.ts
src/app/api/cron/reminders/route.ts
src/components/dashboard-app.tsx, src/components/guest-dashboard-app.tsx, src/components/auth-flow.tsx (label tiếp thị)
README.md (update mô tả)
Phase 2 — Lịch thông minh & UX nâng cao
Mục tiêu: Giải quyết các gap chức năng quan trọng nhưng không khẩn cấp bằng Phase 1.

Dose interval + catch-up logic (src/lib/db.ts + endpoint mới POST /api/schedule-items/:id/shift):
Mỗi template thêm min_interval_days_from_prev (nullable).
Khi user đổi scheduled_date của mũi N, tự suggest dời mũi N+1..N+k dựa trên min_interval_days_from_prev.
Không auto-ghi, chỉ đề xuất (user confirm).
Recurring vaccines (cúm hàng năm, tetanus 10 năm):
Thêm recurrence_rule (jsonb) vào vaccine_templates: { every_years: 1 | 10 }.
Cron/job sinh tiếp mũi mới sau khi mũi trước completed.
Overdue status:
Thêm overdue vào enum schedule_item_status — hoặc tính suy diễn client-side (planned && scheduled_date < today).
Highlight đỏ trên timeline + tab "Quá hạn".
Tuỳ chỉnh cửa sổ nhắc:
reminder_preferences thêm offsets jsonb (VD [{days:7},{days:1},{hours:2}]).
Cron đọc từ jsonb thay vì 2 bool cứng.
Calendar view (month/week) + widget "30 ngày tới".
PDF export sổ tiêm (react-pdf hoặc puppeteer).
Search master vaccine DB khi thêm custom (autocomplete từ vaccine_templates).
Fix cron queue migration (nếu Phase 0 chưa xong): commit việc refactor cron sang queue-based nếu còn nợ.
Phase 3 — Family sharing & polish
Mục tiêu: Mở model multi-user per household + dọn tech debt.

Sharing:
Bảng household_memberships (household_id, user_id, role) với role = owner|editor|viewer.
Bảng family_members thêm household_id (migrate: mỗi user hiện tại → 1 household).
RLS cross-user: check thông qua household_memberships.
Flow invite qua email (magic link).
Upload ảnh sổ tiêm / batch tracking: thêm member_vaccine_items.lot_number, photo_url, adverse_reactions; upload qua Supabase Storage.
Component refactor: tách dashboard-app.tsx (915 dòng) thành MemberSwitcher, ScheduleTimeline, ScheduleItemCard, ReminderSettingsCard, AddMemberForm, CustomItemForm.
Rate limit OTP + flow xoá tài khoản / GDPR export.
i18n structure (next-intl) — giữ VN làm mặc định.
Phase 4 — Ops & observability (optional)
Playwright e2e cho flow critical (login → create member → complete mũi → nhận email).
Audit log cho thao tác nhạy cảm.
Template versioning migration logic (khi vn_default_v2 ra, cho user opt-in upgrade).
Analytics dashboard nội bộ.
Verification (áp dụng sau mỗi phase)
Sau Phase 0:

npm run lint && npm run typecheck && npm run test (vitest) đều pass.
Manual: app mở được, login OTP, dashboard render, cron endpoint trả 200 khi gọi với Bearer CRON_SECRET.
Sau Phase 1 (quan trọng nhất):

Migration chạy sạch trên Supabase staging, data cũ vẫn còn và hiển thị đúng (default member_type='infant').
Tạo member adult → thấy template adult, không thấy template infant.
Tạo member infant → timeline giống hệt bản cũ (regression check).
Vitest: buildScheduleFromTemplates pass cho cả 2 nhánh.
Cron endpoint vẫn gửi email cho member cũ (gọi thủ công qua curl với CRON_SECRET).
Export .ics tải về được, mở được trong Google Calendar.
Smoke manual: toàn bộ button trên dashboard (complete, skip, sửa chi tiết, thêm custom, save reminder) không lỗi 500.
Sau Phase 2:

Dời mũi 1 của infant → hệ thống đề xuất dời mũi 2,3; user confirm thì lịch cập nhật đúng interval.
Tạo adult có cúm → hoàn tất mũi → năm sau xuất hiện mũi mới.
Timeline hiển thị "Quá hạn" cho mũi planned có date < hôm nay.
Sau Phase 3:

Owner invite editor → editor login thấy member của owner, sửa được.
Viewer không sửa được (RLS chặn).
Upload ảnh sổ tiêm thấy trong item detail.