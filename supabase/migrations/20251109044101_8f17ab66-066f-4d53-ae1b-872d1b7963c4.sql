-- Create table for customizable attendance fields
CREATE TABLE public.attendance_fields (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL,
  field_key text NOT NULL,
  field_label text NOT NULL,
  field_description text NOT NULL,
  is_required boolean NOT NULL DEFAULT false,
  display_order integer DEFAULT 0,
  deadline timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(project_id, field_key)
);

-- Create table for speaker attendance responses
CREATE TABLE public.attendance_responses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid NOT NULL,
  field_key text NOT NULL,
  response boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(session_id, field_key)
);

-- Enable RLS
ALTER TABLE public.attendance_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for attendance_fields
CREATE POLICY "Speakers can view attendance fields for their project"
ON public.attendance_fields
FOR SELECT
USING (
  project_id IN (
    SELECT project_id FROM speaker_sessions
    WHERE email = (current_setting('request.jwt.claims', true)::json->>'email')
  )
);

CREATE POLICY "Admins can manage all attendance fields"
ON public.attendance_fields
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
  )
);

-- RLS Policies for attendance_responses
CREATE POLICY "Speakers can view their own attendance responses"
ON public.attendance_responses
FOR SELECT
USING (
  session_id IN (
    SELECT id FROM speaker_sessions
    WHERE email = (current_setting('request.jwt.claims', true)::json->>'email')
  )
);

CREATE POLICY "Speakers can insert their own attendance responses"
ON public.attendance_responses
FOR INSERT
WITH CHECK (
  session_id IN (
    SELECT id FROM speaker_sessions
    WHERE email = (current_setting('request.jwt.claims', true)::json->>'email')
  )
);

CREATE POLICY "Speakers can update their own attendance responses"
ON public.attendance_responses
FOR UPDATE
USING (
  session_id IN (
    SELECT id FROM speaker_sessions
    WHERE email = (current_setting('request.jwt.claims', true)::json->>'email')
  )
);

CREATE POLICY "Admins can view all attendance responses"
ON public.attendance_responses
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_attendance_fields_updated_at
BEFORE UPDATE ON public.attendance_fields
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_attendance_responses_updated_at
BEFORE UPDATE ON public.attendance_responses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();