-- Add privacy consent field to consent_records
ALTER TABLE public.consent_records 
ADD COLUMN IF NOT EXISTS privacy_consent BOOLEAN DEFAULT false;

-- Add signature image path field
ALTER TABLE public.consent_records 
ADD COLUMN IF NOT EXISTS signature_image_path TEXT;

-- Create storage bucket for consent signatures
INSERT INTO storage.buckets (id, name, public)
VALUES ('consent-signatures', 'consent-signatures', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for consent-signatures bucket
CREATE POLICY "Speakers can upload their own consent signatures"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'consent-signatures' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Speakers can view their own consent signatures"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'consent-signatures' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all consent signatures"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'consent-signatures' AND
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
  )
);