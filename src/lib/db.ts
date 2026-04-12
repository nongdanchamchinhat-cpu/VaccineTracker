import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  FamilyMember,
  DashboardBootstrapData,
  ReminderPreferences,
  ScheduleItem,
  VaccineTemplate,
  Household,
  HouseholdMembership,
} from "@/lib/types";
import { DEFAULT_APPOINTMENT_TIME } from "@/lib/constants";
import {
  buildScheduleDraftFromTemplates,
  getNextRecurringDate,
  withDisplayStatus,
} from "@/lib/schedule-logic";

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

export async function ensureDefaultHousehold(userId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: membership, error: membershipError } = await supabase
    .from("household_memberships")
    .select("household_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (membershipError) {
    throw membershipError;
  }

  if (membership?.household_id) {
    return membership.household_id;
  }

  const { data: household, error: householdError } = await supabase
    .from("households")
    .insert({ name: "Gia đình của bạn" })
    .select("id")
    .single();

  if (householdError || !household) {
    throw householdError ?? new Error("Không thể tạo household mặc định.");
  }

  const { error: createMembershipError } = await supabase
    .from("household_memberships")
    .insert({
      household_id: household.id,
      user_id: userId,
      role: "owner",
    });

  if (createMembershipError) {
    throw createMembershipError;
  }

  return household.id;
}

export async function loadDashboardData(
  selectedMemberId?: string,
): Promise<DashboardBootstrapData | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return null;
  }

  await ensureProfile(user.id, user.email);
  await ensureDefaultHousehold(user.id);

  const [
    { data: households, error: householdsError },
    { data: memberships, error: membershipsError },
    { data: members, error: membersError },
  ] = await Promise.all([
    supabase.from("households").select("*").order("created_at", { ascending: true }),
    supabase
      .from("household_memberships")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
    supabase.from("family_members").select("*").order("created_at", { ascending: true }),
  ]);

  if (householdsError) throw householdsError;
  if (membershipsError) throw membershipsError;
  if (membersError) throw membersError;

  const typedMembers = (members ?? []) as FamilyMember[];
  const selectedMember =
    typedMembers.find((member) => member.id === selectedMemberId) ??
    typedMembers[0] ??
    null;

  if (!selectedMember) {
    return {
      userEmail: user.email,
      emailReminderConfigured: Boolean(
        process.env.RESEND_API_KEY && process.env.REMINDER_FROM_EMAIL,
      ),
      members: typedMembers,
      selectedMember: null,
      scheduleItems: [],
      reminderPreferences: null,
      households: (households ?? []) as Household[],
      householdMemberships: (memberships ?? []) as HouseholdMembership[],
    };
  }

  const [{ data: scheduleItems, error: scheduleError }, { data: reminderPreferences, error: reminderError }] =
    await Promise.all([
      supabase
        .from("member_vaccine_items")
        .select("*")
        .eq("member_id", selectedMember.id)
        .order("scheduled_date", { ascending: true })
        .order("sort_order", { ascending: true }),
      supabase
        .from("reminder_preferences")
        .select("*")
        .eq("member_id", selectedMember.id)
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
    emailReminderConfigured: Boolean(
      process.env.RESEND_API_KEY && process.env.REMINDER_FROM_EMAIL,
    ),
    members: typedMembers,
    selectedMember,
    scheduleItems: withDisplayStatus((scheduleItems ?? []) as ScheduleItem[], selectedMember.timezone),
    reminderPreferences: (reminderPreferences as ReminderPreferences | null) ?? null,
    households: (households ?? []) as Household[],
    householdMemberships: (memberships ?? []) as HouseholdMembership[],
  };
}

export async function getOwnedMember(memberId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("family_members")
    .select("*")
    .eq("id", memberId)
    .single();

  if (error) throw error;
  return data as FamilyMember;
}

/**
 * buildScheduleFromTemplates
 * Logic Phase 1: 
 * - infant/child/teen: calculate based on birth_date + recommended_age_days
 * - adult/senior/pregnant: calculate based on today (or member creation date)
 */
export function buildScheduleFromTemplates(
  member: FamilyMember,
  templates: VaccineTemplate[],
) {
  return buildScheduleDraftFromTemplates(member, templates).map((item) => ({
    ...item,
    appointment_time_local: item.appointment_time_local || DEFAULT_APPOINTMENT_TIME,
  }));
}

/**
 * handleRecurrence
 * If an item has a recurrence_rule, create a new planned item for the next period.
 */
export async function handleRecurrence(
  memberId: string,
  completedItem: ScheduleItem,
) {
  const nextDate = getNextRecurringDate(completedItem);
  if (!nextDate) {
    return null;
  }

  const supabase = await createServerSupabaseClient();
  const { data: existingRecurringItem, error: existingRecurringItemError } = await supabase
    .from("member_vaccine_items")
    .select("id")
    .eq("member_id", memberId)
    .eq("scheduled_date", nextDate)
    .eq("vaccine_name", completedItem.vaccine_name)
    .in("status", ["planned", "overdue"])
    .maybeSingle();

  if (existingRecurringItemError) {
    throw existingRecurringItemError;
  }

  if (existingRecurringItem) {
    return null;
  }

  const newItem = {
    member_id: memberId,
    template_entry_id: null,
    sort_order: completedItem.sort_order,
    scheduled_date: nextDate,
    appointment_time_local: completedItem.appointment_time_local,
    recommended_age_days: completedItem.recommended_age_days,
    recommended_age_label: completedItem.recommended_age_label,
    milestone: completedItem.milestone,
    vaccine_name: completedItem.vaccine_name,
    origin: completedItem.origin,
    disease: completedItem.disease,
    estimated_price: completedItem.estimated_price,
    template_source: completedItem.template_source,
    min_interval_days_from_prev: completedItem.min_interval_days_from_prev,
    recurrence_rule: completedItem.recurrence_rule,
    status: "planned",
  };

  const { data, error } = await supabase
    .from("member_vaccine_items")
    .insert(newItem)
    .select("*")
    .single();

  if (error) {
    console.error("Failed to create recurring item:", error);
    return null;
  }

  return data as ScheduleItem;
}
