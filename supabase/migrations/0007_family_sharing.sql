-- 0006_family_sharing.sql
-- Phase 3: Household-based sharing model

-- 1. Create households table
CREATE TABLE IF NOT EXISTS public.households (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- 2. Create household_memberships
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'household_role') THEN
        CREATE TYPE public.household_role AS ENUM ('owner', 'editor', 'viewer');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.household_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.household_role NOT NULL DEFAULT 'owner',
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE(household_id, user_id)
);

-- 3. Update family_members to use household_id
ALTER TABLE public.family_members ADD COLUMN IF NOT EXISTS household_id uuid REFERENCES public.households(id) ON DELETE CASCADE;

-- 4. Initial Migration Logic:
-- For every unique user_id in family_members, create a household and move members there.
-- Also handle users who have no family_members yet but should have a default household?
-- Actually, we can do it lazily or for all profiles.

DO $$
DECLARE
    r RECORD;
    new_house_id uuid;
BEGIN
    -- For users with family members
    FOR r IN SELECT DISTINCT user_id FROM public.family_members WHERE household_id IS NULL LOOP
        INSERT INTO public.households (name) VALUES ('Gia đình của ' || r.user_id) RETURNING id INTO new_house_id;
        
        INSERT INTO public.household_memberships (household_id, user_id, role)
        VALUES (new_house_id, r.user_id, 'owner');
        
        UPDATE public.family_members SET household_id = new_house_id WHERE user_id = r.user_id;
    END LOOP;
    
    -- For users without family members but with a profile
    FOR r IN SELECT id FROM public.profiles p WHERE NOT EXISTS (SELECT 1 FROM public.household_memberships m WHERE m.user_id = p.id) LOOP
        INSERT INTO public.households (name) VALUES ('Gia đình mới') RETURNING id INTO new_house_id;
        INSERT INTO public.household_memberships (household_id, user_id, role)
        VALUES (new_house_id, r.id, 'owner');
    END LOOP;
END $$;

-- 5. Make household_id NOT NULL after migration
-- ALTER TABLE public.family_members ALTER COLUMN household_id SET NOT NULL; 
-- Wait, let's keep it nullable for a bit until we confirm all data is migrated.

-- 6. Update RLS policies to use household memberships
-- family_members
DROP POLICY IF EXISTS "family_members_own_all" ON public.family_members;
CREATE POLICY "family_members_membership_access"
  ON public.family_members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.household_memberships
      WHERE household_memberships.household_id = family_members.household_id
        AND household_memberships.user_id = auth.uid()
    )
  );

-- member_vaccine_items
DROP POLICY IF EXISTS "member_vaccine_items_own_all" ON public.member_vaccine_items;
CREATE POLICY "member_vaccine_items_membership_access"
  ON public.member_vaccine_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.family_members m
      JOIN public.household_memberships hm ON hm.household_id = m.household_id
      WHERE m.id = member_vaccine_items.member_id
        AND hm.user_id = auth.uid()
    )
  );

-- reminder_preferences
DROP POLICY IF EXISTS "reminder_preferences_own_all" ON public.reminder_preferences;
CREATE POLICY "reminder_preferences_membership_access"
  ON public.reminder_preferences
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.family_members m
      JOIN public.household_memberships hm ON hm.household_id = m.household_id
      WHERE m.id = reminder_preferences.member_id
        AND hm.user_id = auth.uid()
    )
  );

-- households
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
CREATE POLICY "households_membership_access"
  ON public.households
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.household_memberships
      WHERE household_memberships.household_id = households.id
        AND household_memberships.user_id = auth.uid()
    )
  );

-- household_memberships
ALTER TABLE public.household_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "household_memberships_access"
  ON public.household_memberships
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.household_memberships our
      WHERE our.household_id = household_memberships.household_id
        AND our.user_id = auth.uid()
    )
  );
