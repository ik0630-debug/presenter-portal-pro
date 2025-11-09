-- Create projects table for managing multiple events
CREATE TABLE public.projects (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  project_name text NOT NULL,
  event_name text NOT NULL,
  description text,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create project_settings table for customizable texts and configurations
CREATE TABLE public.project_settings (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  setting_key text NOT NULL,
  setting_value jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(project_id, setting_key)
);

-- Create admin_users table for managing admin access
CREATE TABLE public.admin_users (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'admin',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add project_id to speaker_sessions
ALTER TABLE public.speaker_sessions 
ADD COLUMN project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;

-- Enable RLS on new tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects table
CREATE POLICY "Admins can manage all projects"
ON public.projects
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE admin_users.user_id = auth.uid()
  )
);

CREATE POLICY "Speakers can view their project"
ON public.projects
FOR SELECT
USING (
  id IN (
    SELECT project_id FROM public.speaker_sessions
    WHERE email = (current_setting('request.jwt.claims'::text, true)::json ->> 'email')
  )
);

-- RLS Policies for project_settings table
CREATE POLICY "Admins can manage all settings"
ON public.project_settings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE admin_users.user_id = auth.uid()
  )
);

CREATE POLICY "Speakers can view their project settings"
ON public.project_settings
FOR SELECT
USING (
  project_id IN (
    SELECT project_id FROM public.speaker_sessions
    WHERE email = (current_setting('request.jwt.claims'::text, true)::json ->> 'email')
  )
);

-- RLS Policies for admin_users table
CREATE POLICY "Admins can view all admin users"
ON public.admin_users
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE admin_users.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage admin users"
ON public.admin_users
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE admin_users.user_id = auth.uid() AND admin_users.role = 'super_admin'
  )
);

-- Add triggers for updated_at
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_settings_updated_at
BEFORE UPDATE ON public.project_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at
BEFORE UPDATE ON public.admin_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();