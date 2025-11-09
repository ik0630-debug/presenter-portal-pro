-- Fix infinite recursion in admin_users RLS policies
DROP POLICY IF EXISTS "Admins can manage admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can view all admin users" ON public.admin_users;

-- Create a security definer function to check admin status
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE admin_users.user_id = $1
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE admin_users.user_id = $1 AND role = 'super_admin'
  );
$$;

-- Recreate admin_users policies using the security definer functions
CREATE POLICY "Admins can view all admin users"
  ON public.admin_users
  FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Super admins can manage admin users"
  ON public.admin_users
  FOR ALL
  USING (public.is_super_admin(auth.uid()));