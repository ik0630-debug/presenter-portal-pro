-- Add organization, department, and position columns to speaker_sessions
ALTER TABLE public.speaker_sessions 
ADD COLUMN organization text,
ADD COLUMN department text,
ADD COLUMN position text;