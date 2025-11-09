-- 관리자가 모든 speaker_sessions를 볼 수 있도록 RLS 정책 추가
CREATE POLICY "Admins can view all sessions"
ON public.speaker_sessions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
  )
);

-- 관리자가 모든 presentation_info를 볼 수 있도록 RLS 정책 추가
CREATE POLICY "Admins can view all presentation info"
ON public.presentation_info
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
  )
);