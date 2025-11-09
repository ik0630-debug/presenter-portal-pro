-- Add external_project_id and slug columns to projects table
ALTER TABLE public.projects 
ADD COLUMN external_project_id uuid,
ADD COLUMN slug text UNIQUE;

-- Add index for faster slug lookups
CREATE INDEX idx_projects_slug ON public.projects(slug);

-- Add index for external_project_id lookups
CREATE INDEX idx_projects_external_id ON public.projects(external_project_id);

-- Add check constraint to ensure slug is URL-safe
ALTER TABLE public.projects
ADD CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');

COMMENT ON COLUMN public.projects.external_project_id IS 'External API project ID (nullable for local-only projects)';
COMMENT ON COLUMN public.projects.slug IS 'URL-friendly project identifier (e.g., ai-conference-2024)';