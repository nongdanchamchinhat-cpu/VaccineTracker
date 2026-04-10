export type ScheduleItemStatus = "planned" | "completed" | "skipped" | "overdue";
export type ReminderChannel = "email";
export type TemplateSource = "vn_default_v1" | "custom";
export type MemberType = "infant" | "child" | "teen" | "adult" | "senior" | "pregnant";
export type HouseholdRole = "owner" | "editor" | "viewer";

export interface Profile {
  id: string;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface Household {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface HouseholdMembership {
  id: string;
  household_id: string;
  user_id: string;
  role: HouseholdRole;
  created_at: string;
  updated_at?: string;
}

export interface HouseholdInvite {
  id: string;
  household_id: string;
  inviter_id: string;
  email: string;
  role: HouseholdRole;
  token: string;
  expires_at: string;
  created_at: string;
}

export interface FamilyMember {
  id: string;
  user_id: string;
  household_id: string | null;
  name: string;
  birth_date: string;
  member_type: MemberType;
  gender: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface RecurrenceRule {
  every_years?: number;
  every_months?: number;
}

export interface VaccineTemplate {
  id: number;
  version: string;
  sort_order: number;
  milestone: string;
  recommended_age_days: number;
  recommended_age_label: string;
  vaccine_name: string;
  origin: string;
  disease: string;
  estimated_price: number;
  appointment_time_local: string;
  template_source: TemplateSource;
  target_member_type: MemberType;
  min_interval_days_from_prev: number | null;
  recurrence_rule: RecurrenceRule | null;
}

export interface ScheduleItem {
  id: string;
  member_id: string;
  template_entry_id: number | null;
  sort_order: number;
  scheduled_date: string;
  appointment_time_local: string;
  recommended_age_days: number | null;
  recommended_age_label: string;
  milestone: string;
  vaccine_name: string;
  origin: string;
  disease: string;
  estimated_price: number | null;
  actual_price: number | null;
  notes: string | null;
  status: ScheduleItemStatus;
  template_source: TemplateSource;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  min_interval_days_from_prev: number | null;
  recurrence_rule: RecurrenceRule | null;
  lot_number: string | null;
  photo_url: string | null;
  adverse_reactions: string | null;
}

export interface ReminderOffset {
  days?: number;
  hours?: number;
  minutes?: number;
}

export interface ReminderPreferences {
  id: string;
  member_id: string;
  reminder_email: string | null;
  channel: ReminderChannel;
  email_enabled: boolean;
  remind_one_day: boolean;
  remind_two_hours: boolean;
  reminder_offsets: ReminderOffset[];
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationDelivery {
  id: string;
  member_id: string;
  member_vaccine_item_id: string;
  channel: ReminderChannel;
  reminder_key: string;
  scheduled_for: string;
  status: "pending" | "sent" | "failed";
  provider_message_id: string | null;
  error_message: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
  sent_at: string | null;
}

export interface DashboardBootstrapData {
  userEmail: string;
  emailReminderConfigured: boolean;
  members: FamilyMember[];
  selectedMember: FamilyMember | null;
  scheduleItems: ScheduleItem[];
  reminderPreferences: ReminderPreferences | null;
  households: Household[];
  householdMemberships: HouseholdMembership[];
}

export interface ApiErrorShape {
  error: string;
}
