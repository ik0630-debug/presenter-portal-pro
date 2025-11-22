import { supabase } from "@/integrations/supabase/client";

export interface ExternalProject {
  id: string;
  title: string; // 외부 DB는 title 사용
  description?: string;
  start_date?: string;
  end_date?: string;
  location?: string;
  speaker_portal_slug?: string;
}

/**
 * 외부 API에서 프로젝트 목록 조회
 */
export async function fetchExternalProjects(): Promise<ExternalProject[]> {
  try {
    const { data, error } = await supabase.functions.invoke('get-external-projects');
    
    if (error) throw error;
    
    return data.projects || [];
  } catch (error) {
    console.error('Failed to fetch external projects:', error);
    throw error;
  }
}

/**
 * 외부 프로젝트를 로컬 프로젝트로 가져오기
 */
export async function importExternalProject(
  externalProject: ExternalProject,
  slug: string
): Promise<void> {
  try {
    const { error } = await supabase.from('projects').insert({
      project_name: externalProject.title, // 외부 DB의 title을 project_name으로
      event_name: externalProject.title, // 외부 DB의 title을 event_name으로
      description: externalProject.description,
      start_date: externalProject.start_date,
      end_date: externalProject.end_date,
      external_project_id: externalProject.id,
      slug: slug,
      is_active: true,
    });

    if (error) throw error;
  } catch (error) {
    console.error('Failed to import external project:', error);
    throw error;
  }
}

/**
 * slug로 프로젝트 조회
 */
export async function getProjectBySlug(slug: string) {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Failed to get project by slug:', error);
    throw error;
  }
}

/**
 * slug 중복 확인
 */
export async function checkSlugAvailability(slug: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;

    return !data; // 데이터가 없으면 사용 가능
  } catch (error) {
    console.error('Failed to check slug availability:', error);
    throw error;
  }
}

/**
 * 한글/영문을 URL-safe slug로 변환
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, '') // 특수문자 제거
    .replace(/\s+/g, '-') // 공백을 대시로
    .replace(/-+/g, '-') // 연속 대시를 하나로
    .replace(/^-|-$/g, ''); // 앞뒤 대시 제거
}
