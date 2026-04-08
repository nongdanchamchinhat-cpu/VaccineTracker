export type ScheduleItemStatus = "planned" | "completed" | "skipped";
export type ReminderChannel = "email";
export type TemplateSource = "vn_default_v1" | "custom";
export type ReminderKey = "before_1_day" | "before_2_hours";

export interface Profile {
  id: string;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChildProfile {
  id: string;
  user_id: string;
  name: string;
  birth_date: string;
  gender: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
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
}

export interface ScheduleItem {
  id: string;
  child_id: string;
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
}

export interface ReminderPreferences {
  id: string;
  child_id: string;
  reminder_email: string | null;
  channel: ReminderChannel;
  email_enabled: boolean;
  remind_one_day: boolean;
  remind_two_hours: boolean;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationDelivery {
  id: string;
  child_id: string;
  child_vaccine_item_id: string;
  channel: ReminderChannel;
  reminder_key: ReminderKey;
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
  children: ChildProfile[];
  selectedChild: ChildProfile | null;
  scheduleItems: ScheduleItem[];
  reminderPreferences: ReminderPreferences | null;
}

export interface ApiErrorShape {
  error: string;
}
