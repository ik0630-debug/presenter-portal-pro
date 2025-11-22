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
    const { projectId } = await req.json();
    
    console.log('Fetching speakers for external project:', projectId);

    // Connect to external Supabase
    const externalSupabase = createClient(
      Deno.env.get('EXTERNAL_SUPABASE_URL')!,
      Deno.env.get('EXTERNAL_SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get all project_speakers for this project without any joins
    const { data: projectSpeakers, error: speakersError } = await externalSupabase
      .from('project_speakers')
      .select('*')
      .eq('project_id', projectId);

    if (speakersError) {
      console.error('Failed to fetch project speakers:', speakersError);
      throw speakersError;
    }

    console.log(`Found ${projectSpeakers?.length || 0} project_speakers`);
    if (projectSpeakers && projectSpeakers.length > 0) {
      console.log('First project_speaker columns:', Object.keys(projectSpeakers[0]));
      console.log('First project_speaker data:', projectSpeakers[0]);
    }

    // Transform the data - map all possible field names to our interface
    const speakers = projectSpeakers?.map((ps: any) => ({
      id: ps.id || ps.speaker_id || crypto.randomUUID(),
      name: ps.speaker_name || ps.name || ps.full_name || ps.title || 'Unknown',
      email: ps.speaker_email || ps.email || ps.contact_email || null,
      organization: ps.organization || ps.company || ps.institution || null,
      department: ps.department || ps.dept || null,
      position: ps.position || ps.job_title || ps.title || null,
      phone: ps.speaker_phone || ps.phone || ps.mobile || ps.contact_phone || null,
    })) || [];

    console.log(`Returning ${speakers.length} speakers`);

    return new Response(
      JSON.stringify({ speakers }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error: any) {
    console.error('Error in get-external-speakers:', error);
    return new Response(
      JSON.stringify({ 
        error: '연사 목록을 가져오는 중 오류가 발생했습니다.',
        details: error?.message || 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

