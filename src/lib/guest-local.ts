import { DateTime } from "luxon";

import {
  DEFAULT_APPOINTMENT_TIME,
  DEFAULT_TEMPLATE_VERSION,
  DEFAULT_TIMEZONE,
} from "@/lib/constants";
import {
  ChildProfile,
  DashboardBootstrapData,
  ReminderPreferences,
  ScheduleItem,
  VaccineTemplate,
} from "@/lib/types";

export const GUEST_STORAGE_KEY = "kobe-tracker-guest-v1";

type GuestStorageShape = {
  children: ChildProfile[];
  scheduleItems: ScheduleItem[];
  reminderPreferencesByChild: Record<string, ReminderPreferences>;
  selectedChildId: string | null;
};

export const DEFAULT_VACCINE_TEMPLATES: VaccineTemplate[] = [
  {
    id: 1,
    version: DEFAULT_TEMPLATE_VERSION,
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
  },
  {
    id: 2,
    version: DEFAULT_TEMPLATE_VERSION,
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
  },
  {
    id: 3,
    version: DEFAULT_TEMPLATE_VERSION,
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
  },
  {
    id: 4,
    version: DEFAULT_TEMPLATE_VERSION,
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
  },
  {
    id: 5,
    version: DEFAULT_TEMPLATE_VERSION,
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
  },
  {
    id: 6,
    version: DEFAULT_TEMPLATE_VERSION,
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
  },
  {
    id: 7,
    version: DEFAULT_TEMPLATE_VERSION,
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
  },
  {
    id: 8,
    version: DEFAULT_TEMPLATE_VERSION,
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
  },
  {
    id: 9,
    version: DEFAULT_TEMPLATE_VERSION,
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
  },
  {
    id: 10,
    version: DEFAULT_TEMPLATE_VERSION,
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
  },
  {
    id: 11,
    version: DEFAULT_TEMPLATE_VERSION,
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
  },
  {
    id: 12,
    version: DEFAULT_TEMPLATE_VERSION,
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
  },
  {
    id: 13,
    version: DEFAULT_TEMPLATE_VERSION,
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
  },
  {
    id: 14,
    version: DEFAULT_TEMPLATE_VERSION,
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
  },
  {
    id: 15,
    version: DEFAULT_TEMPLATE_VERSION,
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
  },
  {
    id: 16,
    version: DEFAULT_TEMPLATE_VERSION,
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
  },
  {
    id: 17,
    version: DEFAULT_TEMPLATE_VERSION,
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
  },
  {
    id: 18,
    version: DEFAULT_TEMPLATE_VERSION,
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
  },
  {
    id: 19,
    version: DEFAULT_TEMPLATE_VERSION,
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
  },
  {
    id: 20,
    version: DEFAULT_TEMPLATE_VERSION,
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
  },
  {
    id: 21,
    version: DEFAULT_TEMPLATE_VERSION,
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
  },
  {
    id: 22,
    version: DEFAULT_TEMPLATE_VERSION,
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
  },
  {
    id: 23,
    version: DEFAULT_TEMPLATE_VERSION,
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
  },
  {
    id: 24,
    version: DEFAULT_TEMPLATE_VERSION,
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
  },
];

function makeId() {
  return crypto.randomUUID();
}

export function createGuestChild({
  name,
  birthDate,
  gender,
}: {
  name: string;
  birthDate: string;
  gender?: string | null;
}) {
  const now = new Date().toISOString();
  return {
    id: makeId(),
    user_id: "guest",
    name,
    birth_date: birthDate,
    gender: gender ?? null,
    timezone: DEFAULT_TIMEZONE,
    created_at: now,
    updated_at: now,
  } satisfies ChildProfile;
}

export function createGuestReminderPreference(
  child: ChildProfile,
  fallbackEmail = "",
) {
  const now = new Date().toISOString();
  return {
    id: makeId(),
    child_id: child.id,
    reminder_email: fallbackEmail,
    channel: "email",
    email_enabled: false,
    remind_one_day: true,
    remind_two_hours: true,
    timezone: child.timezone,
    created_at: now,
    updated_at: now,
  } satisfies ReminderPreferences;
}

export function createGuestScheduleFromTemplates(child: ChildProfile) {
  const now = new Date().toISOString();

  return DEFAULT_VACCINE_TEMPLATES.map((template) => ({
    id: makeId(),
    child_id: child.id,
    template_entry_id: template.id,
    sort_order: template.sort_order,
    scheduled_date:
      DateTime.fromISO(child.birth_date)
        .plus({ days: template.recommended_age_days })
        .toISODate() ?? child.birth_date,
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
    completed_at: null,
    created_at: now,
    updated_at: now,
  })) satisfies ScheduleItem[];
}

export function createEmptyGuestBootstrap(): DashboardBootstrapData {
  return {
    userEmail: "",
    emailReminderConfigured: false,
    children: [],
    selectedChild: null,
    scheduleItems: [],
    reminderPreferences: null,
  };
}

export function loadGuestStorage(): GuestStorageShape {
  if (typeof window === "undefined") {
    return {
      children: [],
      scheduleItems: [],
      reminderPreferencesByChild: {},
      selectedChildId: null,
    };
  }

  try {
    const raw = window.localStorage.getItem(GUEST_STORAGE_KEY);
    if (!raw) {
      return {
        children: [],
        scheduleItems: [],
        reminderPreferencesByChild: {},
        selectedChildId: null,
      };
    }

    const parsed = JSON.parse(raw) as Partial<GuestStorageShape>;
    return {
      children: parsed.children ?? [],
      scheduleItems: parsed.scheduleItems ?? [],
      reminderPreferencesByChild: parsed.reminderPreferencesByChild ?? {},
      selectedChildId: parsed.selectedChildId ?? null,
    };
  } catch {
    return {
      children: [],
      scheduleItems: [],
      reminderPreferencesByChild: {},
      selectedChildId: null,
    };
  }
}

export function saveGuestStorage(storage: GuestStorageShape) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(storage));
}
