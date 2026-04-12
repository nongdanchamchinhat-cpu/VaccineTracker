-- 0010_household_role_policies.sql
-- Phase 3: enforce owner/editor writes and viewer read-only access

-- family_members
DROP POLICY IF EXISTS "family_members_membership_access" ON public.family_members;

CREATE POLICY "family_members_read_access"
  ON public.family_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.household_memberships
      WHERE household_memberships.household_id = family_members.household_id
        AND household_memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "family_members_write_access"
  ON public.family_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.household_memberships
      WHERE household_memberships.household_id = family_members.household_id
        AND household_memberships.user_id = auth.uid()
        AND household_memberships.role IN ('owner', 'editor')
    )
  );

CREATE POLICY "family_members_update_access"
  ON public.family_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.household_memberships
      WHERE household_memberships.household_id = family_members.household_id
        AND household_memberships.user_id = auth.uid()
        AND household_memberships.role IN ('owner', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.household_memberships
      WHERE household_memberships.household_id = family_members.household_id
        AND household_memberships.user_id = auth.uid()
        AND household_memberships.role IN ('owner', 'editor')
    )
  );

CREATE POLICY "family_members_delete_access"
  ON public.family_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.household_memberships
      WHERE household_memberships.household_id = family_members.household_id
        AND household_memberships.user_id = auth.uid()
        AND household_memberships.role IN ('owner', 'editor')
    )
  );

-- member_vaccine_items
DROP POLICY IF EXISTS "member_vaccine_items_membership_access" ON public.member_vaccine_items;

CREATE POLICY "member_vaccine_items_read_access"
  ON public.member_vaccine_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.family_members m
      JOIN public.household_memberships hm ON hm.household_id = m.household_id
      WHERE m.id = member_vaccine_items.member_id
        AND hm.user_id = auth.uid()
    )
  );

CREATE POLICY "member_vaccine_items_write_access"
  ON public.member_vaccine_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.family_members m
      JOIN public.household_memberships hm ON hm.household_id = m.household_id
      WHERE m.id = member_vaccine_items.member_id
        AND hm.user_id = auth.uid()
        AND hm.role IN ('owner', 'editor')
    )
  );

CREATE POLICY "member_vaccine_items_update_access"
  ON public.member_vaccine_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.family_members m
      JOIN public.household_memberships hm ON hm.household_id = m.household_id
      WHERE m.id = member_vaccine_items.member_id
        AND hm.user_id = auth.uid()
        AND hm.role IN ('owner', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.family_members m
      JOIN public.household_memberships hm ON hm.household_id = m.household_id
      WHERE m.id = member_vaccine_items.member_id
        AND hm.user_id = auth.uid()
        AND hm.role IN ('owner', 'editor')
    )
  );

CREATE POLICY "member_vaccine_items_delete_access"
  ON public.member_vaccine_items
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.family_members m
      JOIN public.household_memberships hm ON hm.household_id = m.household_id
      WHERE m.id = member_vaccine_items.member_id
        AND hm.user_id = auth.uid()
        AND hm.role IN ('owner', 'editor')
    )
  );

-- reminder_preferences
DROP POLICY IF EXISTS "reminder_preferences_membership_access" ON public.reminder_preferences;

CREATE POLICY "reminder_preferences_read_access"
  ON public.reminder_preferences
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.family_members m
      JOIN public.household_memberships hm ON hm.household_id = m.household_id
      WHERE m.id = reminder_preferences.member_id
        AND hm.user_id = auth.uid()
    )
  );

CREATE POLICY "reminder_preferences_write_access"
  ON public.reminder_preferences
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.family_members m
      JOIN public.household_memberships hm ON hm.household_id = m.household_id
      WHERE m.id = reminder_preferences.member_id
        AND hm.user_id = auth.uid()
        AND hm.role IN ('owner', 'editor')
    )
  );

CREATE POLICY "reminder_preferences_update_access"
  ON public.reminder_preferences
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.family_members m
      JOIN public.household_memberships hm ON hm.household_id = m.household_id
      WHERE m.id = reminder_preferences.member_id
        AND hm.user_id = auth.uid()
        AND hm.role IN ('owner', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.family_members m
      JOIN public.household_memberships hm ON hm.household_id = m.household_id
      WHERE m.id = reminder_preferences.member_id
        AND hm.user_id = auth.uid()
        AND hm.role IN ('owner', 'editor')
    )
  );

CREATE POLICY "reminder_preferences_delete_access"
  ON public.reminder_preferences
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.family_members m
      JOIN public.household_memberships hm ON hm.household_id = m.household_id
      WHERE m.id = reminder_preferences.member_id
        AND hm.user_id = auth.uid()
        AND hm.role IN ('owner', 'editor')
    )
  );

-- Storage policies for vaccine-records bucket
DROP POLICY IF EXISTS "Vaccine records upload access" ON storage.objects;
DROP POLICY IF EXISTS "Vaccine records read access" ON storage.objects;
DROP POLICY IF EXISTS "Vaccine records delete access" ON storage.objects;

CREATE POLICY "Vaccine records upload access"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'vaccine-records'
    AND EXISTS (
      SELECT 1
      FROM public.family_members m
      JOIN public.household_memberships hm ON hm.household_id = m.household_id
      WHERE m.id = split_part(name, '/', 1)::uuid
        AND hm.user_id = auth.uid()
        AND hm.role IN ('owner', 'editor')
    )
  );

CREATE POLICY "Vaccine records read access"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'vaccine-records'
    AND EXISTS (
      SELECT 1
      FROM public.family_members m
      JOIN public.household_memberships hm ON hm.household_id = m.household_id
      WHERE m.id = split_part(name, '/', 1)::uuid
        AND hm.user_id = auth.uid()
    )
  );

CREATE POLICY "Vaccine records delete access"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'vaccine-records'
    AND EXISTS (
      SELECT 1
      FROM public.family_members m
      JOIN public.household_memberships hm ON hm.household_id = m.household_id
      WHERE m.id = split_part(name, '/', 1)::uuid
        AND hm.user_id = auth.uid()
        AND hm.role IN ('owner', 'editor')
    )
  );
