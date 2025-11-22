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

    // First, check project_speakers table structure
    const { data: sampleProjectSpeaker, error: psError } = await externalSupabase
      .from('project_speakers')
      .select('*')
      .eq('project_id', projectId)
      .limit(1)
      .maybeSingle();

    if (psError) {
      console.error('Failed to fetch project_speakers structure:', psError);
    } else if (sampleProjectSpeaker) {
      console.log('project_speakers columns:', Object.keys(sampleProjectSpeaker));
    }

    // Get all project_speakers for this project
    const { data: projectSpeakers, error: speakersError } = await externalSupabase
      .from('project_speakers')
      .select('*')
      .eq('project_id', projectId);

    if (speakersError) {
      console.error('Failed to fetch project speakers:', speakersError);
      throw speakersError;
    }

    console.log('Found project_speakers:', projectSpeakers?.length || 0);
    if (projectSpeakers && projectSpeakers.length > 0) {
      console.log('First project_speaker:', projectSpeakers[0]);
    }

    // Transform the data based on what fields are available
    const speakers = projectSpeakers?.map((ps: any) => ({
      id: ps.id,
      name: ps.speaker_name || ps.name || ps.supplier_name || 'Unknown',
      email: ps.email || ps.speaker_email || null,
      organization: ps.organization || ps.company || null,
      department: ps.department || null,
      position: ps.position || ps.job_title || null,
      phone: ps.phone || ps.mobile || ps.contact_phone || null,
    })) || [];

    console.log(`Found ${speakers.length} speakers`);

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
