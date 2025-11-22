-- Allow admins to delete speaker sessions
CREATE POLICY "Admins can delete sessions"
ON speaker_sessions
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
  )
);