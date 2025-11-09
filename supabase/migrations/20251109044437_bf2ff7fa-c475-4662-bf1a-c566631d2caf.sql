-- Create table for transportation settings configured by admin
CREATE TABLE public.transportation_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL,
  supported_methods jsonb NOT NULL DEFAULT '["대중교통", "자차", "KTX", "항공", "기타"]'::jsonb,
  requires_receipt boolean NOT NULL DEFAULT true,
  receipt_deadline timestamp with time zone,
  additional_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(project_id)
);

-- Enable RLS
ALTER TABLE public.transportation_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for transportation_settings
CREATE POLICY "Speakers can view transportation settings for their project"
ON public.transportation_settings
FOR SELECT
USING (
  project_id IN (
    SELECT project_id FROM speaker_sessions
    WHERE email = (current_setting('request.jwt.claims', true)::json->>'email')
  )
);

CREATE POLICY "Admins can manage all transportation settings"
ON public.transportation_settings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
  )
);

-- Add receipt_file_path to transportation_info
ALTER TABLE public.transportation_info
ADD COLUMN IF NOT EXISTS receipt_file_path text;

-- Create trigger for updated_at
CREATE TRIGGER update_transportation_settings_updated_at
BEFORE UPDATE ON public.transportation_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();