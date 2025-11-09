-- Add is_primary column to presentation_files table to track the primary presentation file
ALTER TABLE presentation_files 
ADD COLUMN is_primary boolean NOT NULL DEFAULT false;

-- Add a comment to explain the column
COMMENT ON COLUMN presentation_files.is_primary IS '우선 송출 파일 여부';

-- Create an index for better query performance
CREATE INDEX idx_presentation_files_is_primary ON presentation_files(session_id, is_primary) WHERE is_primary = true;