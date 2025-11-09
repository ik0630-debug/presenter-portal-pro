-- Add presentation_info_fields setting to project_settings
-- This will store configurable presentation info checkbox fields

-- Insert default presentation info fields for existing projects
INSERT INTO project_settings (project_id, setting_key, setting_value)
SELECT 
  id,
  'presentation_info_fields',
  jsonb_build_array(
    jsonb_build_object(
      'id', 'use_video',
      'label', '동영상 상영',
      'description', '발표에 동영상이 포함되어 있습니다',
      'order', 1,
      'enabled', true
    ),
    jsonb_build_object(
      'id', 'use_audio',
      'label', '소리 사용',
      'description', '발표 중 오디오를 재생합니다',
      'order', 2,
      'enabled', true
    ),
    jsonb_build_object(
      'id', 'use_personal_laptop',
      'label', '개인 노트북 사용',
      'description', '본인의 노트북으로 발표합니다',
      'order', 3,
      'enabled', true
    )
  )
FROM projects
WHERE NOT EXISTS (
  SELECT 1 
  FROM project_settings 
  WHERE project_settings.project_id = projects.id 
  AND project_settings.setting_key = 'presentation_info_fields'
);