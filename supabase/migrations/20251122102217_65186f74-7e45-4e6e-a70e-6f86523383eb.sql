-- Add phone field to speaker_sessions table
ALTER TABLE public.speaker_sessions 
ADD COLUMN phone text;

COMMENT ON COLUMN public.speaker_sessions.phone IS '연사 휴대전화';
