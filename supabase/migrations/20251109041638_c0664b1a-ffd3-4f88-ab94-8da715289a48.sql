-- Create arrival_guide_settings table for managing arrival guide information per project
CREATE TABLE public.arrival_guide_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  venue_name TEXT NOT NULL DEFAULT '',
  venue_address TEXT NOT NULL DEFAULT '',
  venue_map_url TEXT,
  parking_info TEXT,
  check_in_time TEXT,
  check_in_location TEXT,
  presentation_time TEXT,
  presentation_room TEXT,
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  additional_notes TEXT,
  emergency_contact TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.arrival_guide_settings ENABLE ROW LEVEL SECURITY;

-- Policies for admins
CREATE POLICY "Admins can manage all arrival guide settings"
ON public.arrival_guide_settings
FOR ALL
USING (EXISTS (
  SELECT 1 FROM admin_users
  WHERE admin_users.user_id = auth.uid()
));

-- Policy for speakers to view their project's arrival guide
CREATE POLICY "Speakers can view arrival guide for their project"
ON public.arrival_guide_settings
FOR SELECT
USING (project_id IN (
  SELECT speaker_sessions.project_id
  FROM speaker_sessions
  WHERE speaker_sessions.email = (current_setting('request.jwt.claims', true)::json->>'email')
));

-- Add trigger for updated_at
CREATE TRIGGER update_arrival_guide_settings_updated_at
BEFORE UPDATE ON public.arrival_guide_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();