-- Add receipt_upload_deadline setting to project_settings
-- This will store the deadline for uploading receipts for each project

-- Insert default receipt upload deadline settings for existing projects
INSERT INTO project_settings (project_id, setting_key, setting_value)
SELECT 
  id,
  'receipt_upload_deadline',
  jsonb_build_object(
    'deadline_days', 3,
    'include_weekends', true,
    'custom_deadline', null
  )
FROM projects
WHERE NOT EXISTS (
  SELECT 1 
  FROM project_settings 
  WHERE project_settings.project_id = projects.id 
  AND project_settings.setting_key = 'receipt_upload_deadline'
);

COMMENT ON COLUMN project_settings.setting_value IS 'JSON object storing various project settings including receipt_upload_deadline';