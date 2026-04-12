-- 0008_sharing_invites.sql
-- Phase 3: Household invitation system

CREATE TABLE IF NOT EXISTS public.household_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  inviter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role public.household_role NOT NULL DEFAULT 'editor',
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- RLS for invites
ALTER TABLE public.household_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage invites"
ON public.household_invites
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.household_memberships
    WHERE household_memberships.household_id = household_invites.household_id
      AND household_memberships.user_id = auth.uid()
      AND household_memberships.role = 'owner'
  )
);

CREATE POLICY "Anyone with token can read invite"
ON public.household_invites
FOR SELECT
USING (true);
