const API_BASE_URL = 'https://tllwsebpkvcvqacgmvsp.supabase.co/functions/v1/speaker-portal-api';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsbHdzZWJwa3ZjdnFhY2dtdnNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NjQ0MzEsImV4cCI6MjA3NzM0MDQzMX0.buBXmNO0wl618u7WXxkg3fgi8vyU3XNH3rRQGCWmcJM';

export interface PortalConfig {
  project?: {
    id: string;
    project_name: string;
    event_name: string;
    start_date?: string;
    end_date?: string;
  };
  settings?: any;
}

export interface SpeakerResponse {
  id: string;
  project_id: string;
  speaker_email: string;
  step_data: Record<string, any>;
  completed_steps: number[];
  created_at: string;
  updated_at: string;
}

export interface Step6Data {
  eventName: string;
  venue: string;
  address: string;
  room: string;
  time: string;
  checkInTime: string;
  checkInLocation: string;
  parking: string;
  contact: {
    name: string;
    phone: string;
    email: string;
  };
  emergency: string;
  notes: string;
}

/**
 * 포털 설정 조회
 */
export async function getConfig(projectId: string): Promise<PortalConfig> {
  const response = await fetch(
    `${API_BASE_URL}?action=get-config&projectId=${projectId}`,
    {
      headers: {
        'apikey': API_KEY
      }
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch config');
  }

  const data = await response.json();
  return data.config || {};
}

/**
 * 연사 응답 조회
 */
export async function getResponse(projectId: string, speakerEmail: string): Promise<SpeakerResponse | null> {
  const response = await fetch(
    `${API_BASE_URL}?action=get-response&projectId=${projectId}&speakerEmail=${encodeURIComponent(speakerEmail)}`,
    {
      headers: {
        'apikey': API_KEY
      }
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error('Failed to fetch response');
  }

  const data = await response.json();
  return data.response || null;
}

/**
 * Step 6 데이터 조회 (현장안내)
 */
export async function getStep6Data(projectId: string, speakerEmail: string): Promise<Step6Data | null> {
  const response = await fetch(
    `${API_BASE_URL}?action=get-step6-data&projectId=${projectId}&speakerEmail=${encodeURIComponent(speakerEmail)}`,
    {
      headers: {
        'apikey': API_KEY
      }
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error('Failed to fetch step 6 data');
  }

  const data = await response.json();
  return data.data || null;
}

/**
 * 연사 응답 저장/업데이트
 */
export async function upsertResponse(
  projectId: string,
  speakerEmail: string,
  step: number,
  stepData: any,
  completedSteps: number[]
): Promise<SpeakerResponse> {
  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': API_KEY
    },
    body: JSON.stringify({
      action: 'upsert-response',
      projectId,
      speakerEmail,
      step,
      stepData,
      completedSteps
    })
  });

  if (!response.ok) {
    throw new Error('Failed to upsert response');
  }

  const data = await response.json();
  return data.response;
}

/**
 * 파일 업로드
 */
export async function uploadFile(
  projectId: string,
  speakerEmail: string,
  fileType: string,
  file: File,
  responseId?: string
): Promise<{ fileUrl: string; fileName: string }> {
  const formData = new FormData();
  formData.append('projectId', projectId);
  formData.append('speakerEmail', speakerEmail);
  formData.append('fileType', fileType);
  formData.append('file', file);
  if (responseId) {
    formData.append('responseId', responseId);
  }

  const response = await fetch(
    `${API_BASE_URL}?action=upload-file`,
    {
      method: 'POST',
      headers: {
        'apikey': API_KEY
      },
      body: formData
    }
  );

  if (!response.ok) {
    throw new Error('Failed to upload file');
  }

  const data = await response.json();
  return data.file;
}
