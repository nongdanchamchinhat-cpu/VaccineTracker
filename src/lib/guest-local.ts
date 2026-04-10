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
    id: 201,
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
    id: 301,
    version: "vn_teen_v1",
    sort_order: 1,
    milestone: "Mốc 9 tuổi",
    recommended_age_days: 3285,
    recommended_age_label: "9 tuổi",
    vaccine_name: "HPV - Mũi 1",
    origin: "Mỹ",
    disease: "HPV, ung thư cổ tử cung, mụn cóc sinh dục",
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
    vaccine_name: "HPV - Mũi 2",
    origin: "Mỹ",
    disease: "HPV, ung thư cổ tử cung, mụn cóc sinh dục",
    estimated_price: 1790000,
    appointment_time_local: DEFAULT_APPOINTMENT_TIME,
    template_source: "vn_default_v1",
    target_member_type: "teen",
    min_interval_days_from_prev: 180,
    recurrence_rule: null,
  },
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
    id: 1101,
    version: "vn_senior_v1",
    sort_order: 1,
    milestone: "Ưu tiên ngay khi đăng ký",
    recommended_age_days: 0,
    recommended_age_label: "Ngay khi join",
    vaccine_name: "Phế cầu (PCV13)",
    origin: "Bỉ",
    disease: "Viêm phổi, viêm màng não do phế cầu",
    estimated_price: 1190000,
    appointment_time_local: DEFAULT_APPOINTMENT_TIME,
    template_source: "vn_default_v1",
    target_member_type: "senior",
    min_interval_days_from_prev: null,
    recurrence_rule: null,
  },
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
