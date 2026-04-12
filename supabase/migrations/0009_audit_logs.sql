-- 0009_audit_logs.sql
-- Phase 4: Ops & Observability - Audit Logging

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can insert their own actions
CREATE POLICY "Users can insert their own logs"
ON public.audit_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- System admin or users can view their logs
CREATE POLICY "Users can read their own logs"
ON public.audit_logs FOR SELECT
USING (auth.uid() = user_id);

-- Note: We can expand this logic to allow household owners to see household logs.
