import { DateTime } from "luxon";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  ChildProfile,
  DashboardBootstrapData,
  ReminderPreferences,
  ScheduleItem,
  VaccineTemplate,
} from "@/lib/types";
import { DEFAULT_APPOINTMENT_TIME } from "@/lib/constants";

export async function getCurrentUserOrNull() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function ensureProfile(userId: string, email: string | null) {
  const supabase = await createServerSupabaseClient();
  await supabase.from("profiles").upsert({ id: userId, email }, { onConflict: "id" });
}

export async function loadDashboardData(
  selectedChildId?: string,
): Promise<DashboardBootstrapData | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return null;
  }

  await ensureProfile(user.id, user.email);

  const { data: children, error: childrenError } = await supabase
    .from("children")
    .select("*")
    .order("created_at", { ascending: true });

  if (childrenError) {
    throw childrenError;
  }

  const typedChildren = (children ?? []) as ChildProfile[];
  const selectedChild =
    typedChildren.find((child) => child.id === selectedChildId) ??
    typedChildren[0] ??
    null;

  if (!selectedChild) {
    return {
      userEmail: user.email,
      children: typedChildren,
      selectedChild: null,
      scheduleItems: [],
      reminderPreferences: null,
    };
  }

  const [{ data: scheduleItems, error: scheduleError }, { data: reminderPreferences, error: reminderError }] =
    await Promise.all([
      supabase
        .from("child_vaccine_items")
        .select("*")
        .eq("child_id", selectedChild.id)
        .order("scheduled_date", { ascending: true })
        .order("sort_order", { ascending: true }),
      supabase
        .from("reminder_preferences")
        .select("*")
        .eq("child_id", selectedChild.id)
        .maybeSingle(),
    ]);

  if (scheduleError) {
    throw scheduleError;
  }

  if (reminderError) {
    throw reminderError;
  }

  return {
    userEmail: user.email,
    children: typedChildren,
    selectedChild,
    scheduleItems: (scheduleItems ?? []) as ScheduleItem[],
    reminderPreferences: (reminderPreferences as ReminderPreferences | null) ?? null,
  };
}

export async function getOwnedChild(childId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("children")
    .select("*")
    .eq("id", childId)
    .single();

  if (error) throw error;
  return data as ChildProfile;
}

export function buildScheduleFromTemplates(
  child: ChildProfile,
  templates: VaccineTemplate[],
) {
  return templates.map((template) => {
    const scheduledDate = DateTime.fromISO(child.birth_date)
      .plus({ days: template.recommended_age_days })
      .toISODate();

    return {
      child_id: child.id,
      template_entry_id: template.id,
      sort_order: template.sort_order,
      scheduled_date: scheduledDate,
      appointment_time_local: template.appointment_time_local || DEFAULT_APPOINTMENT_TIME,
      recommended_age_days: template.recommended_age_days,
      recommended_age_label: template.recommended_age_label,
      milestone: template.milestone,
      vaccine_name: template.vaccine_name,
      origin: template.origin,
      disease: template.disease,
      estimated_price: template.estimated_price,
      template_source: template.template_source,
    };
  });
}
