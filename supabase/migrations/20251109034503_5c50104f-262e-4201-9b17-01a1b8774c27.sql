-- Create table for custom presentation fields
CREATE TABLE IF NOT EXISTS public.presentation_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  field_key TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'checkbox', -- checkbox, text, textarea
  field_description TEXT,
  is_required BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(project_id, field_key)
);

-- Add custom_fields jsonb column to presentation_info
ALTER TABLE public.presentation_info 
ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;

-- Enable RLS
ALTER TABLE public.presentation_fields ENABLE ROW LEVEL SECURITY;

-- Admins can manage all presentation fields
CREATE POLICY "Admins can manage all presentation fields"
ON public.presentation_fields
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
  )
);

-- Speakers can view fields for their project
CREATE POLICY "Speakers can view presentation fields for their project"
ON public.presentation_fields
FOR SELECT
USING (
  project_id IN (
    SELECT speaker_sessions.project_id
    FROM speaker_sessions
    WHERE speaker_sessions.email = (current_setting('request.jwt.claims', true)::json->>'email')
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_presentation_fields_updated_at
  BEFORE UPDATE ON public.presentation_fields
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();