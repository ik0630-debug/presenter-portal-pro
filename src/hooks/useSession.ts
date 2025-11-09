import { useState, useEffect } from 'react';

interface SpeakerSession {
  id: string;
  project_id: string;
  speaker_id: string;
  speaker_name: string;
  email: string;
  event_name?: string;
  presentation_date?: string;
  organization?: string;
  department?: string;
  position?: string;
}

export const useSession = () => {
  const [session, setSession] = useState<SpeakerSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const sessionStr = localStorage.getItem('speakerSession');
      if (!sessionStr) {
        setError('세션 정보를 찾을 수 없습니다.');
        setLoading(false);
        return;
      }

      const parsedSession = JSON.parse(sessionStr) as SpeakerSession;
      setSession(parsedSession);
    } catch (err) {
      console.error('Session parsing error:', err);
      setError('세션 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSession = (newSession: SpeakerSession) => {
    localStorage.setItem('speakerSession', JSON.stringify(newSession));
    setSession(newSession);
  };

  const clearSession = () => {
    localStorage.removeItem('speakerSession');
    setSession(null);
  };

  return {
    session,
    sessionId: session?.id,
    projectId: session?.project_id,
    speakerName: session?.speaker_name,
    loading,
    error,
    updateSession,
    clearSession,
  };
};
