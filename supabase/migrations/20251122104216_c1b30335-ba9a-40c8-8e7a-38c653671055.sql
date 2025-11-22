-- Add INSERT policy for admins on speaker_sessions table
CREATE POLICY "Admins can insert sessions"
ON speaker_sessions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
  )
);