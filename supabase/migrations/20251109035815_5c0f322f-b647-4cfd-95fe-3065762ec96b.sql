-- Create consent_fields table for dynamic consent items
CREATE TABLE IF NOT EXISTS public.consent_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  field_key TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_required BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(project_id, field_key)
);

-- Add custom_consents jsonb column to consent_records
ALTER TABLE public.consent_records 
ADD COLUMN IF NOT EXISTS custom_consents JSONB DEFAULT '{}'::jsonb;

-- Enable RLS
ALTER TABLE public.consent_fields ENABLE ROW LEVEL SECURITY;

-- Admins can manage all consent fields
CREATE POLICY "Admins can manage all consent fields"
ON public.consent_fields
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
  )
);

-- Speakers can view consent fields for their project
CREATE POLICY "Speakers can view consent fields for their project"
ON public.consent_fields
FOR SELECT
USING (
  project_id IN (
    SELECT speaker_sessions.project_id
    FROM speaker_sessions
    WHERE speaker_sessions.email = (current_setting('request.jwt.claims', true)::json->>'email')
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_consent_fields_updated_at
  BEFORE UPDATE ON public.consent_fields
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();