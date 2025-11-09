import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching external projects...');

    // Connect to external Supabase
    const externalSupabase = createClient(
      Deno.env.get('EXTERNAL_SUPABASE_URL')!,
      Deno.env.get('EXTERNAL_SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get all projects with their speakers
    const { data: projects, error: projectsError } = await externalSupabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (projectsError) {
      console.error('Failed to fetch projects:', projectsError);
      throw projectsError;
    }

    console.log(`Found ${projects?.length || 0} projects`);

    // Get speakers for each project
    const projectsWithSpeakers = await Promise.all(
      (projects || []).map(async (project) => {
        const { data: projectSpeakers, error: speakersError } = await externalSupabase
          .from('project_speakers')
          .select(`
            id,
            presentation_time,
            presentation_topic,
            honorarium,
            contact_phone,
            contact_email,
            expected_attendees,
            suppliers!supplier_id (
              id,
              name,
              email,
              phone,
              professional_types
            )
          `)
          .eq('project_id', project.id);

        if (speakersError) {
          console.error(`Error fetching speakers for project ${project.id}:`, speakersError);
          return {
            ...project,
            speakers: [],
          };
        }

        console.log(`Project ${project.id}: ${projectSpeakers?.length || 0} speakers`);

        return {
          ...project,
          speakers: (projectSpeakers || []).map((ps: any) => ({
            id: ps.suppliers?.id,
            name: ps.suppliers?.name,
            email: ps.suppliers?.email,
            phone: ps.suppliers?.phone,
            professional_types: ps.suppliers?.professional_types,
            presentation_time: ps.presentation_time,
            presentation_topic: ps.presentation_topic,
            honorarium: ps.honorarium,
            contact_phone: ps.contact_phone,
            contact_email: ps.contact_email,
            expected_attendees: ps.expected_attendees,
          })),
        };
      })
    );

    console.log('Successfully fetched all projects with speakers');

    return new Response(
      JSON.stringify({ projects: projectsWithSpeakers }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error: any) {
    console.error('Error in get-external-projects:', error);
    return new Response(
      JSON.stringify({ 
        error: '외부 시스템에서 프로젝트 정보를 가져오는 중 오류가 발생했습니다.',
        details: error?.message || 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
