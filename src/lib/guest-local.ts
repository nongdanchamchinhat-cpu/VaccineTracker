import { DateTime } from "luxon";

import {
  DEFAULT_APPOINTMENT_TIME,
  DEFAULT_TIMEZONE,
} from "@/lib/constants";
import {
  FamilyMember,
  DashboardBootstrapData,
  ReminderPreferences,
  ScheduleItem,
  VaccineTemplate,
  MemberType,
} from "@/lib/types";
import { normalizeReminderOffsets } from "@/lib/reminders";
import { withDisplayStatus } from "@/lib/schedule-logic";

export const GUEST_STORAGE_KEY = "family-tracker-guest-v1";

type GuestStorageShape = {
  members: FamilyMember[];
  scheduleItems: ScheduleItem[];
  reminderPreferencesByMember: Record<string, ReminderPreferences>;
  selectedMemberId: string | null;
};

export const DEFAULT_VACCINE_TEMPLATES: VaccineTemplate[] = [
  // ── INFANT (vn_default_v1) — 24 mũi ─────────────────────────────────────
  {
    id: 1,
    version: "vn_default_v1",
    sort_order: 1,
    milestone: "Mốc 2 tháng tuổi",
    recommended_age_days: 59,
    recommended_age_label: "1 tháng 29 ngày",
    vaccine_name: "Infanrix Hexa (6 trong 1) — Mũi 1",
    origin: "Bỉ",
    disease: "Bạch hầu, Ho gà, Uốn ván, Bại liệt, Viêm gan B, Hib",
    estimated_price: 1098000,
    appointment_time_local: DEFAULT_APPOINTMENT_TIME,
    template_source: "vn_default_v1",
    target_member_type: "infant",
    min_interval_days_from_prev: null,
    recurrence_rule: null,
  },
  {
    id: 2,
    version: "vn_default_v1",
    sort_order: 2,
    milestone: "Mốc 2 tháng tuổi",
    recommended_age_days: 66,
    recommended_age_label: "2 tháng 6 ngày",
    vaccine_name: "Rotateq — Liều uống 1",
    origin: "Mỹ",
    disease: "Tiêu chảy cấp do Rotavirus",
    estimated_price: 665000,
    appointment_time_local: DEFAULT_APPOINTMENT_TIME,
    template_source: "vn_default_v1",
    target_member_type: "infant",
    min_interval_days_from_prev: null,
    recurrence_rule: null,
  },
  {
    id: 3,
    version: "vn_default_v1",
    sort_order: 3,
    milestone: "Mốc 2 tháng tuổi",
    recommended_age_days: 73,
    recommended_age_label: "2 tháng 13 ngày",
    vaccine_name: "Prevenar 13 (Phế cầu) — Mũi 1",
    origin: "Bỉ",
    disease: "Viêm phổi, Viêm màng não, Viêm tai giữa do phế cầu",
    estimated_price: 1190000,
    appointment_time_local: DEFAULT_APPOINTMENT_TIME,
    template_source: "vn_default_v1",
    target_member_type: "infant",
    min_interval_days_from_prev: null,
    recurrence_rule: null,
  },
  {
    id: 4,
    version: "vn_default_v1",
    sort_order: 4,
    milestone: "Mốc 2 tháng tuổi",
    recommended_age_days: 80,
    recommended_age_label: "2 tháng 20 ngày",
    vaccine_name: "Bexsero (Não mô cầu B) — Mũi 1",
    origin: "Ý",
    disease: "Viêm màng não do não mô cầu nhóm B",
    estimated_price: 1788000,
    appointment_time_local: DEFAULT_APPOINTMENT_TIME,
    template_source: "vn_default_v1",
    target_member_type: "infant",
    min_interval_days_from_prev: null,
    recurrence_rule: null,
  },
  {
    id: 5,
    version: "vn_default_v1",
    sort_order: 5,
    milestone: "Mốc 2 tháng tuổi",
    recommended_age_days: 87,
    recommended_age_label: "2 tháng 27 ngày",
    vaccine_name: "MenQuadfi (Não mô cầu ACYW) — Mũi 1",
    origin: "Mỹ",
    disease: "Viêm màng não do não mô cầu nhóm A, C, Y, W-135",
    estimated_price: 1950000,
    appointment_time_local: DEFAULT_APPOINTMENT_TIME,
    template_source: "vn_default_v1",
    target_member_type: "infant",
    min_interval_days_from_prev: null,
    recurrence_rule: null,
  },
  {
    id: 6,
    version: "vn_default_v1",
    sort_order: 6,
    milestone: "Mốc 3 tháng tuổi",
    recommended_age_days: 96,
    recommended_age_label: "3 tháng 6 ngày",
    vaccine_name: "Infanrix Hexa (6 trong 1) — Mũi 2",
    origin: "Bỉ",
    disease: "Bạch hầu, Ho gà, Uốn ván, Bại liệt, Viêm gan B, Hib",
    estimated_price: 1098000,
    appointment_time_local: DEFAULT_APPOINTMENT_TIME,
    template_source: "vn_default_v1",
    target_member_type: "infant",
    min_interval_days_from_prev: 28,
    recurrence_rule: null,
  },
  {
    id: 7,
    version: "vn_default_v1",
    sort_order: 7,
    milestone: "Mốc 3 tháng tuổi",
    recommended_age_days: 103,
    recommended_age_label: "3 tháng 13 ngày",
    vaccine_name: "Rotateq — Liều uống 2",
    origin: "Mỹ",
    disease: "Tiêu chảy cấp do Rotavirus",
    estimated_price: 665000,
    appointment_time_local: DEFAULT_APPOINTMENT_TIME,
    template_source: "vn_default_v1",
    target_member_type: "infant",
    min_interval_days_from_prev: 28,
    recurrence_rule: null,
  },
  {
    id: 8,
    version: "vn_default_v1",
    sort_order: 8,
    milestone: "Mốc 3 tháng tuổi",
    recommended_age_days: 110,
    recommended_age_label: "3 tháng 20 ngày",
    vaccine_name: "Prevenar 13 (Phế cầu) — Mũi 2",
    origin: "Bỉ",
    disease: "Viêm phổi, Viêm màng não, Viêm tai giữa do phế cầu",
    estimated_price: 1190000,
    appointment_time_local: DEFAULT_APPOINTMENT_TIME,
    template_source: "vn_default_v1",
    target_member_type: "infant",
    min_interval_days_from_prev: 28,
    recurrence_rule: null,
  },
  {
    id: 9,
    version: "vn_default_v1",
    sort_order: 9,
    milestone: "Mốc 4 tháng tuổi",
    recommended_age_days: 129,
    recommended_age_label: "4 tháng 9 ngày",
    vaccine_name: "Infanrix Hexa (6 trong 1) — Mũi 3",
    origin: "Bỉ",
    disease: "Bạch hầu, Ho gà, Uốn ván, Bại liệt, Viêm gan B, Hib",
    estimated_price: 1098000,
    appointment_time_local: DEFAULT_APPOINTMENT_TIME,
    template_source: "vn_default_v1",
    target_member_type: "infant",
    min_interval_days_from_prev: 28,
    recurrence_rule: null,
  },
  {
    id: 10,
    version: "vn_default_v1",
    sort_order: 10,
    milestone: "Mốc 4 tháng tuổi",
    recommended_age_days: 136,
    recommended_age_label: "4 tháng 16 ngày",
    vaccine_name: "Rotateq — Liều uống 3",
    origin: "Mỹ",
    disease: "Tiêu chảy cấp do Rotavirus",
    estimated_price: 665000,
    appointment_time_local: DEFAULT_APPOINTMENT_TIME,
    template_source: "vn_default_v1",
    target_member_type: "infant",
    min_interval_days_from_prev: 28,
    recurrence_rule: null,
  },
  {
    id: 11,
    version: "vn_default_v1",
    sort_order: 11,
    milestone: "Mốc 4 tháng tuổi",
    recommended_age_days: 143,
    recommended_age_label: "4 tháng 23 ngày",
    vaccine_name: "Prevenar 13 (Phế cầu) — Mũi 3",
    origin: "Bỉ",
    disease: "Viêm phổi, Viêm màng não, Viêm tai giữa do phế cầu",
    estimated_price: 1190000,
    appointment_time_local: DEFAULT_APPOINTMENT_TIME,
    template_source: "vn_default_v1",
    target_member_type: "infant",
    min_interval_days_from_prev: 28,
    recurrence_rule: null,
  },
  {
    id: 12,
    version: "vn_default_v1",
    sort_order: 12,
    milestone: "Mốc 4 tháng tuổi",
    recommended_age_days: 150,
    recommended_age_label: "5 tháng 0 ngày",
    vaccine_name: "Bexsero (Não mô cầu B) — Mũi 2",
    origin: "Ý",
    disease: "Viêm màng não do não mô cầu nhóm B",
    estimated_price: 1788000,
    appointment_time_local: DEFAULT_APPOINTMENT_TIME,
    template_source: "vn_default_v1",
    target_member_type: "infant",
    min_interval_days_from_prev: null,
    recurrence_rule: null,
  },
  {
    id: 13,
    version: "vn_default_v1",
    sort_order: 13,
    milestone: "Mốc 4 tháng tuổi",
    recommended_age_days: 157,
    recommended_age_label: "5 tháng 7 ngày",
    vaccine_name: "MenQuadfi (Não mô cầu ACYW) — Mũi 2",
    origin: "Mỹ",
    disease: "Viêm màng não do não mô cầu nhóm A, C, Y, W-135",
    estimated_price: 1950000,
    appointment_time_local: DEFAULT_APPOINTMENT_TIME,
    template_source: "vn_default_v1",
    target_member_type: "infant",
    min_interval_days_from_prev: null,
    recurrence_rule: null,
  },
  {
    id: 14,
    version: "vn_default_v1",
    sort_order: 14,
    milestone: "Mốc 6 tháng tuổi",
    recommended_age_days: 185,
    recommended_age_label: "6 tháng 5 ngày",
    vaccine_name: "Vắc xin Cúm tứ giá — Mũi 1",
    origin: "Pháp/Mỹ",
    disease: "Cúm mùa",
    estimated_price: 356000,
    appointment_time_local: DEFAULT_APPOINTMENT_TIME,
    template_source: "vn_default_v1",
    target_member_type: "infant",
    min_interval_days_from_prev: null,
    recurrence_rule: null,
  },
  {
    id: 15,
    version: "vn_default_v1",
    sort_order: 15,
    milestone: "Mốc 6 tháng tuổi",
    recommended_age_days: 192,
    recommended_age_label: "6 tháng 12 ngày",
    vaccine_name: "MenQuadfi (Não mô cầu ACYW) — Mũi 3",
    origin: "Mỹ",
    disease: "Viêm màng não do não mô cầu nhóm A, C, Y, W-135",
    estimated_price: 1950000,
    appointment_time_local: DEFAULT_APPOINTMENT_TIME,
    template_source: "vn_default_v1",
    target_member_type: "infant",
    min_interval_days_from_prev: null,
    recurrence_rule: null,
  },
  {
    id: 16,
    version: "vn_default_v1",
    sort_order: 16,
    milestone: "Mốc 6 tháng tuổi",
    recommended_age_days: 213,
    recommended_age_label: "7 tháng 3 ngày",
    vaccine_name: "Vắc xin Cúm tứ giá — Mũi 2",
    origin: "Pháp/Mỹ",
    disease: "Cúm mùa (mũi 2 cách mũi 1 tối thiểu 4 tuần)",
    estimated_price: 356000,
    appointment_time_local: DEFAULT_APPOINTMENT_TIME,
    template_source: "vn_default_v1",
    target_member_type: "infant",
    min_interval_days_from_prev: null,
    recurrence_rule: null,
  },
  {
    id: 17,
    version: "vn_default_v1",
    sort_order: 17,
    milestone: "Mốc 9 tháng tuổi",
    recommended_age_days: 276,
    recommended_age_label: "9 tháng 6 ngày",
    vaccine_name: "Sởi đơn / MMR — Mũi 1",
    origin: "Ấn Độ/Mỹ",
    disease: "Sởi (hoặc Sởi-Quai bị-Rubella nếu dùng MMR)",
    estimated_price: 155000,
    appointment_time_local: DEFAULT_APPOINTMENT_TIME,
    template_source: "vn_default_v1",
    target_member_type: "infant",
    min_interval_days_from_prev: null,
    recurrence_rule: null,
  },
  {
    id: 18,
    version: "vn_default_v1",
    sort_order: 18,
    milestone: "Mốc 12 tháng tuổi",
    recommended_age_days: 367,
    recommended_age_label: "12 tháng 7 ngày",
    vaccine_name: "MMR / Priorix (Sởi-Quai bị-Rubella) — Mũi 1",
    origin: "Mỹ/Bỉ",
    disease: "Sởi, Quai bị, Rubella",
    estimated_price: 350000,
    appointment_time_local: DEFAULT_APPOINTMENT_TIME,
    template_source: "vn_default_v1",
    target_member_type: "infant",
    min_interval_days_from_prev: null,
    recurrence_rule: null,
  },
  {
    id: 19,
    version: "vn_default_v1",
    sort_order: 19,
    milestone: "Mốc 12 tháng tuổi",
    recommended_age_days: 374,
    recommended_age_label: "12 tháng 14 ngày",
    vaccine_name: "Varivax (Thủy đậu) — Mũi 1",
    origin: "Mỹ",
    disease: "Thủy đậu",
    estimated_price: 985000,
    appointment_time_local: DEFAULT_APPOINTMENT_TIME,
    template_source: "vn_default_v1",
    target_member_type: "infant",
    min_interval_days_from_prev: null,
    recurrence_rule: null,
  },
  {
    id: 20,
    version: "vn_default_v1",
    sort_order: 20,
    milestone: "Mốc 12 tháng tuổi",
    recommended_age_days: 381,
    recommended_age_label: "12 tháng 21 ngày",
    vaccine_name: "Imojev (Viêm não Nhật Bản) — Mũi 1",
    origin: "Thái Lan",
    disease: "Viêm não Nhật Bản",
    estimated_price: 988000,
    appointment_time_local: DEFAULT_APPOINTMENT_TIME,
    template_source: "vn_default_v1",
    target_member_type: "infant",
    min_interval_days_from_prev: null,
    recurrence_rule: null,
  },
  {
    id: 21,
    version: "vn_default_v1",
    sort_order: 21,
    milestone: "Mốc 12 tháng tuổi",
    recommended_age_days: 388,
    recommended_age_label: "12 tháng 28 ngày",
    vaccine_name: "Prevenar 13 (Phế cầu) — Mũi nhắc",
    origin: "Bỉ",
    disease: "Viêm phổi, Viêm màng não do phế cầu (nhắc lại)",
    estimated_price: 1190000,
    appointment_time_local: DEFAULT_APPOINTMENT_TIME,
    template_source: "vn_default_v1",
    target_member_type: "infant",
    min_interval_days_from_prev: null,
    recurrence_rule: null,
  },
  {
    id: 22,
    version: "vn_default_v1",
    sort_order: 22,
    milestone: "Mốc 12 tháng tuổi",
    recommended_age_days: 395,
    recommended_age_label: "13 tháng 5 ngày",
    vaccine_name: "Bexsero (Não mô cầu B) — Mũi nhắc",
    origin: "Ý",
    disease: "Viêm màng não do não mô cầu nhóm B (nhắc lại)",
    estimated_price: 1788000,
    appointment_time_local: DEFAULT_APPOINTMENT_TIME,
    template_source: "vn_default_v1",
    target_member_type: "infant",
    min_interval_days_from_prev: null,
    recurrence_rule: null,
  },
  {
    id: 23,
    version: "vn_default_v1",
    sort_order: 23,
    milestone: "Mốc 12 tháng tuổi",
    recommended_age_days: 402,
    recommended_age_label: "13 tháng 12 ngày",
    vaccine_name: "MenQuadfi (Não mô cầu ACYW) — Mũi nhắc",
    origin: "Mỹ",
    disease: "Viêm màng não do não mô cầu ACYW (nhắc lại)",
    estimated_price: 1950000,
    appointment_time_local: DEFAULT_APPOINTMENT_TIME,
    template_source: "vn_default_v1",
    target_member_type: "infant",
    min_interval_days_from_prev: null,
    recurrence_rule: null,
  },
  {
    id: 24,
    version: "vn_default_v1",
    sort_order: 24,
    milestone: "Mốc 12 tháng tuổi",
    recommended_age_days: 409,
    recommended_age_label: "13 tháng 19 ngày",
    vaccine_name: "Avaxim 80U (Viêm gan A) — Mũi 1",
    origin: "Pháp",
    disease: "Viêm gan A",
    estimated_price: 765000,
    appointment_time_local: DEFAULT_APPOINTMENT_TIME,
    template_source: "vn_default_v1",
    target_member_type: "infant",
    min_interval_days_from_prev: null,
    recurrence_rule: null,
  },
  // ── CHILD (vn_child_v1) — 2 mũi ──────────────────────────────────────────
  {
    id: 101,
    version: "vn_child_v1",
    sort_order: 1,
    milestone: "Mốc 4 tuổi",
    recommended_age_days: 1460,
    recommended_age_label: "4 tuổi",
    vaccine_name: "MMR (Sởi-Quai bị-Rubella) nhắc lại",
    origin: "Mỹ/Bỉ",
    disease: "Sởi, Quai bị, Rubella",
    estimated_price: 350000,
    appointment_time_local: DEFAULT_APPOINTMENT_TIME,
    template_source: "vn_default_v1",
    target_member_type: "child",
    min_interval_days_from_prev: null,
    recurrence_rule: null,
  },
  {
    id: 102,
    version: "vn_child_v1",
    sort_order: 2,
    milestone: "Mốc 4 tuổi",
    recommended_age_days: 1467,
    recommended_age_label: "4 tuổi + 1 tuần",
    vaccine_name: "Varivax (Thủy đậu) nhắc lại",
    origin: "Mỹ",
    disease: "Thủy đậu",
    estimated_price: 985000,
    appointment_time_local: DEFAULT_APPOINTMENT_TIME,
    template_source: "vn_default_v1",
    target_member_type: "child",
    min_interval_days_from_prev: null,
    recurrence_rule: null,
  },
  // ── TEEN (vn_teen_v1) — 2 mũi ────────────────────────────────────────────
  {
    id: 301,
    version: "vn_teen_v1",
    sort_order: 1,
    milestone: "Mốc 9 tuổi",
    recommended_age_days: 3285,
    recommended_age_label: "9 tuổi",
    vaccine_name: "HPV (Ung thư CTC) - Mũi 1",
    origin: "Mỹ",
    disease: "Ung thư cổ tử cung, Mụn cóc sinh dục",
    estimated_price: 1790000,
    appointment_time_local: DEFAULT_APPOINTMENT_TIME,
    template_source: "vn_default_v1",
    target_member_type: "teen",
    min_interval_days_from_prev: null,
    recurrence_rule: null,
  },
  {
    id: 302,
    version: "vn_teen_v1",
    sort_order: 2,
    milestone: "Mốc 9 tuổi 6 tháng",
    recommended_age_days: 3465,
    recommended_age_label: "9 tuổi + 6 tháng",
    vaccine_name: "HPV (Ung thư CTC) - Mũi 2",
    origin: "Mỹ",
    disease: "Ung thư cổ tử cung, Mụn cóc sinh dục",
    estimated_price: 1790000,
    appointment_time_local: DEFAULT_APPOINTMENT_TIME,
    template_source: "vn_default_v1",
    target_member_type: "teen",
    min_interval_days_from_prev: 180,
    recurrence_rule: null,
  },
  // ── ADULT (vn_adult_v1) — 3 mũi ──────────────────────────────────────────
  {
    id: 1001,
    version: "vn_adult_v1",
    sort_order: 1,
    milestone: "Ưu tiên ngay khi đăng ký",
    recommended_age_days: 0,
    recommended_age_label: "Ngay khi join",
    vaccine_name: "Cúm mùa hàng năm (v1)",
    origin: "Pháp",
    disease: "Cúm mùa",
    estimated_price: 356000,
    appointment_time_local: DEFAULT_APPOINTMENT_TIME,
    template_source: "vn_default_v1",
    target_member_type: "adult",
    min_interval_days_from_prev: null,
    recurrence_rule: { every_years: 1 },
  },
  {
    id: 1002,
    version: "vn_adult_v1",
    sort_order: 2,
    milestone: "Ưu tiên ngay khi đăng ký",
    recommended_age_days: 0,
    recommended_age_label: "Ngay khi join",
    vaccine_name: "Tdap (Bạch hầu-Ho gà-Uốn ván)",
    origin: "Mỹ",
    disease: "Uốn ván, Bạch hầu, Ho gà",
    estimated_price: 650000,
    appointment_time_local: DEFAULT_APPOINTMENT_TIME,
    template_source: "vn_default_v1",
    target_member_type: "adult",
    min_interval_days_from_prev: null,
    recurrence_rule: { every_years: 10 },
  },
  {
    id: 1003,
    version: "vn_adult_v1",
    sort_order: 3,
    milestone: "Ưu tiên ngay khi đăng ký",
    recommended_age_days: 0,
    recommended_age_label: "Ngay khi join",
    vaccine_name: "Viêm gan B (nếu chưa tiêm)",
    origin: "Hàn Quốc",
    disease: "Viêm gan B",
    estimated_price: 185000,
    appointment_time_local: DEFAULT_APPOINTMENT_TIME,
    template_source: "vn_default_v1",
    target_member_type: "adult",
    min_interval_days_from_prev: null,
    recurrence_rule: null,
  },
  // ── SENIOR (vn_senior_v1) — 2 mũi ────────────────────────────────────────
  {
    id: 1101,
    version: "vn_senior_v1",
    sort_order: 1,
    milestone: "Ưu tiên ngay khi đăng ký",
    recommended_age_days: 0,
    recommended_age_label: "Ngay khi join",
    vaccine_name: "Phế cầu (PCV13)",
    origin: "Bỉ",
    disease: "Viêm phổi, Viêm màng não do phế cầu",
    estimated_price: 1190000,
    appointment_time_local: DEFAULT_APPOINTMENT_TIME,
    template_source: "vn_default_v1",
    target_member_type: "senior",
    min_interval_days_from_prev: null,
    recurrence_rule: null,
  },
  {
    id: 1102,
    version: "vn_senior_v1",
    sort_order: 2,
    milestone: "Ưu tiên ngay khi đăng ký",
    recommended_age_days: 0,
    recommended_age_label: "Ngay khi join",
    vaccine_name: "Cúm mùa hàng năm",
    origin: "Pháp",
    disease: "Cúm mùa",
    estimated_price: 356000,
    appointment_time_local: DEFAULT_APPOINTMENT_TIME,
    template_source: "vn_default_v1",
    target_member_type: "senior",
    min_interval_days_from_prev: null,
    recurrence_rule: { every_years: 1 },
  },
  // ── PREGNANT (vn_pregnancy_v1) — 1 mũi ───────────────────────────────────
  {
    id: 1201,
    version: "vn_pregnancy_v1",
    sort_order: 1,
    milestone: "Tuần 27-36",
    recommended_age_days: 0,
    recommended_age_label: "Khi mang thai",
    vaccine_name: "Tdap (Uốn ván-Bạch hầu-Ho gà)",
    origin: "Mỹ",
    disease: "Uốn ván, bạch hầu, ho gà",
    estimated_price: 650000,
    appointment_time_local: DEFAULT_APPOINTMENT_TIME,
    template_source: "vn_default_v1",
    target_member_type: "pregnant",
    min_interval_days_from_prev: null,
    recurrence_rule: null,
  },
];

function makeId() {
  return crypto.randomUUID();
}

export function createGuestMember({
  name,
  birthDate,
  memberType,
  gender,
}: {
  name: string;
  birthDate: string;
  memberType: MemberType;
  gender?: string | null;
}) {
  const now = new Date().toISOString();
  return {
    id: makeId(),
    user_id: "guest",
    household_id: null,
    name,
    birth_date: birthDate,
    member_type: memberType,
    gender: gender ?? null,
    timezone: DEFAULT_TIMEZONE,
    created_at: now,
    updated_at: now,
  } satisfies FamilyMember;
}

export function createGuestReminderPreference(
  member: FamilyMember,
  fallbackEmail = "",
) {
  const now = new Date().toISOString();
  const reminderOffsets = normalizeReminderOffsets(undefined, {
    remind_one_day: true,
    remind_two_hours: true,
  });

  return {
    id: makeId(),
    member_id: member.id,
    reminder_email: fallbackEmail,
    channel: "email",
    email_enabled: false,
    remind_one_day: true,
    remind_two_hours: true,
    reminder_offsets: reminderOffsets,
    timezone: member.timezone,
    created_at: now,
    updated_at: now,
  } satisfies ReminderPreferences;
}

export function createGuestScheduleFromTemplates(member: FamilyMember) {
  const now = new Date().toISOString();
  
  const baseDateStr = ["infant", "child", "teen"].includes(member.member_type)
    ? member.birth_date
    : member.created_at;

  const baseDate = DateTime.fromISO(baseDateStr);

  return DEFAULT_VACCINE_TEMPLATES
    .filter((template) => template.target_member_type === member.member_type)
    .map((template) => ({
      id: makeId(),
      member_id: member.id,
      template_entry_id: template.id,
      sort_order: template.sort_order,
      scheduled_date:
        baseDate
          .plus({ days: template.recommended_age_days })
          .toISODate() ?? baseDate.toISODate()!,
      appointment_time_local: template.appointment_time_local || DEFAULT_APPOINTMENT_TIME,
      recommended_age_days: template.recommended_age_days,
      recommended_age_label: template.recommended_age_label,
      milestone: template.milestone,
      vaccine_name: template.vaccine_name,
      origin: template.origin,
      disease: template.disease,
      estimated_price: template.estimated_price,
      actual_price: null,
      notes: null,
      status: "planned",
      template_source: template.template_source,
      min_interval_days_from_prev: template.min_interval_days_from_prev,
      recurrence_rule: template.recurrence_rule,
      lot_number: null,
      photo_url: null,
      adverse_reactions: null,
      completed_at: null,
      created_at: now,
      updated_at: now,
    })) satisfies ScheduleItem[];
}

function normalizeGuestReminderPreference(
  preference: ReminderPreferences | undefined,
  memberTimezone: string,
): ReminderPreferences | undefined {
  if (!preference) return undefined;

  return {
    ...preference,
    reminder_offsets: normalizeReminderOffsets(
      preference.reminder_offsets,
      preference,
    ),
    timezone: preference.timezone || memberTimezone,
  };
}

function normalizeGuestScheduleItem(item: ScheduleItem, timezone: string): ScheduleItem {
  const normalized = {
    ...item,
    min_interval_days_from_prev: item.min_interval_days_from_prev ?? null,
    recurrence_rule: item.recurrence_rule ?? null,
  } satisfies ScheduleItem;

  return withDisplayStatus([normalized], timezone)[0]!;
}

export function createEmptyGuestBootstrap(): DashboardBootstrapData {
  return {
    userEmail: "",
    emailReminderConfigured: false,
    members: [],
    selectedMember: null,
    scheduleItems: [],
    reminderPreferences: null,
    households: [],
    householdMemberships: [],
  };
}

export function loadGuestStorage(): GuestStorageShape {
  if (typeof window === "undefined") {
    return {
      members: [],
      scheduleItems: [],
      reminderPreferencesByMember: {},
      selectedMemberId: null,
    };
  }

  try {
    const raw = window.localStorage.getItem(GUEST_STORAGE_KEY);
    if (!raw) {
      return {
        members: [],
        scheduleItems: [],
        reminderPreferencesByMember: {},
        selectedMemberId: null,
      };
    }

    const parsed = JSON.parse(raw) as Partial<GuestStorageShape> & {
      children?: FamilyMember[];
      reminderPreferencesByChild?: Record<string, ReminderPreferences>;
      selectedChildId?: string | null;
    };
    const members = parsed.members ?? parsed.children ?? [];
    const memberById = new Map(members.map((member) => [member.id, member]));
    const scheduleItems = (parsed.scheduleItems ?? []).map((item) =>
      normalizeGuestScheduleItem(
        item as ScheduleItem,
        memberById.get((item as ScheduleItem).member_id)?.timezone ?? DEFAULT_TIMEZONE,
      ),
    );
    const rawReminderPreferencesByMember =
      parsed.reminderPreferencesByMember ?? parsed.reminderPreferencesByChild ?? {};
    const reminderPreferencesByMember = Object.fromEntries(
      Object.entries(rawReminderPreferencesByMember).map(([memberId, preference]) => [
        memberId,
        normalizeGuestReminderPreference(
          preference,
          memberById.get(memberId)?.timezone ?? DEFAULT_TIMEZONE,
        ) ?? createGuestReminderPreference(
          memberById.get(memberId) ?? {
            id: memberId,
            user_id: "guest",
            household_id: null,
            name: "",
            birth_date: DateTime.now().toISODate() ?? "1970-01-01",
            member_type: "adult",
            gender: null,
            timezone: DEFAULT_TIMEZONE,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ),
      ]),
    ) satisfies Record<string, ReminderPreferences>;
    const selectedMemberId = parsed.selectedMemberId ?? parsed.selectedChildId ?? null;

    return {
      members,
      scheduleItems,
      reminderPreferencesByMember,
      selectedMemberId,
    };
  } catch {
    return {
      members: [],
      scheduleItems: [],
      reminderPreferencesByMember: {},
      selectedMemberId: null,
    };
  }
}

export function saveGuestStorage(storage: GuestStorageShape) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(storage));
}
