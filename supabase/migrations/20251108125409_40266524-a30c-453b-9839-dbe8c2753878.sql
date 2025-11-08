-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create speaker_sessions table (links to external DB supplier)
CREATE TABLE public.speaker_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text NOT NULL UNIQUE,
  speaker_id text NOT NULL, -- External supplier ID
  external_supplier_id uuid, -- Reference to external DB
  speaker_name text NOT NULL,
  event_name text,
  presentation_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create presentation_files table
CREATE TABLE public.presentation_files (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id uuid REFERENCES public.speaker_sessions(id) ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  file_type text NOT NULL,
  upload_deadline timestamp with time zone,
  uploaded_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create presentation_info table
CREATE TABLE public.presentation_info (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id uuid REFERENCES public.speaker_sessions(id) ON DELETE CASCADE NOT NULL UNIQUE,
  use_audio boolean DEFAULT false,
  use_personal_laptop boolean DEFAULT false,
  use_video boolean DEFAULT false,
  special_requests text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create consent_records table
CREATE TABLE public.consent_records (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id uuid REFERENCES public.speaker_sessions(id) ON DELETE CASCADE NOT NULL UNIQUE,
  copyright_consent boolean DEFAULT false,
  portrait_consent boolean DEFAULT false,
  recording_consent boolean DEFAULT false,
  distribution_consent boolean DEFAULT false,
  consent_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.speaker_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presentation_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presentation_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for speaker_sessions
CREATE POLICY "Speakers can view their own session"
  ON public.speaker_sessions FOR SELECT
  USING (email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Speakers can update their own session"
  ON public.speaker_sessions FOR UPDATE
  USING (email = current_setting('request.jwt.claims', true)::json->>'email');

-- Create RLS policies for presentation_files
CREATE POLICY "Speakers can view their own files"
  ON public.presentation_files FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM public.speaker_sessions
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

CREATE POLICY "Speakers can insert their own files"
  ON public.presentation_files FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT id FROM public.speaker_sessions
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

CREATE POLICY "Speakers can update their own files"
  ON public.presentation_files FOR UPDATE
  USING (
    session_id IN (
      SELECT id FROM public.speaker_sessions
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

CREATE POLICY "Speakers can delete their own files"
  ON public.presentation_files FOR DELETE
  USING (
    session_id IN (
      SELECT id FROM public.speaker_sessions
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

-- Create RLS policies for presentation_info
CREATE POLICY "Speakers can view their own presentation info"
  ON public.presentation_info FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM public.speaker_sessions
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

CREATE POLICY "Speakers can insert their own presentation info"
  ON public.presentation_info FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT id FROM public.speaker_sessions
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

CREATE POLICY "Speakers can update their own presentation info"
  ON public.presentation_info FOR UPDATE
  USING (
    session_id IN (
      SELECT id FROM public.speaker_sessions
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

-- Create RLS policies for consent_records
CREATE POLICY "Speakers can view their own consent records"
  ON public.consent_records FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM public.speaker_sessions
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

CREATE POLICY "Speakers can insert their own consent records"
  ON public.consent_records FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT id FROM public.speaker_sessions
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

CREATE POLICY "Speakers can update their own consent records"
  ON public.consent_records FOR UPDATE
  USING (
    session_id IN (
      SELECT id FROM public.speaker_sessions
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_speaker_sessions_updated_at
  BEFORE UPDATE ON public.speaker_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_presentation_files_updated_at
  BEFORE UPDATE ON public.presentation_files
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_presentation_info_updated_at
  BEFORE UPDATE ON public.presentation_info
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_consent_records_updated_at
  BEFORE UPDATE ON public.consent_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for presentation files
INSERT INTO storage.buckets (id, name, public)
VALUES ('presentations', 'presentations', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Speakers can upload their presentations"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'presentations' AND
    auth.jwt()->>'email' IN (
      SELECT email FROM public.speaker_sessions
      WHERE id::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "Speakers can view their presentations"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'presentations' AND
    auth.jwt()->>'email' IN (
      SELECT email FROM public.speaker_sessions
      WHERE id::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "Speakers can update their presentations"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'presentations' AND
    auth.jwt()->>'email' IN (
      SELECT email FROM public.speaker_sessions
      WHERE id::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "Speakers can delete their presentations"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'presentations' AND
    auth.jwt()->>'email' IN (
      SELECT email FROM public.speaker_sessions
      WHERE id::text = (storage.foldername(name))[1]
    )
  );