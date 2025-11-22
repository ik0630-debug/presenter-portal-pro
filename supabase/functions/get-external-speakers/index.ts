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

    // Join project_speakers with suppliers using speaker_id
    const { data: projectSpeakers, error: fetchError } = await externalSupabase
      .from('project_speakers')
      .select(`
        id,
        speaker_id,
        suppliers!project_speakers_speaker_id_fkey (
          id,
          title,
          nickname,
          representative,
          company_name,
          email,
          mobile,
          phone
        )
      `)
      .eq('project_id', projectId);

    if (fetchError) {
      console.error('Failed to fetch project speakers:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${projectSpeakers?.length || 0} project_speakers`);
    if (projectSpeakers && projectSpeakers.length > 0) {
      console.log('First joined speaker:', projectSpeakers[0]);
    }

    // Transform the data using the joined suppliers table
    // Note: In the external DB, company_name often contains the person's name
    // title, nickname, representative can be null
    const speakers = projectSpeakers?.map((ps: any) => {
      const supplier = ps.suppliers;
      return {
        id: supplier?.id || ps.speaker_id,
        // Use company_name as the primary name source (it contains person's name)
        name: supplier?.company_name || supplier?.nickname || supplier?.representative || supplier?.title || 'Unknown',
        email: supplier?.email || null,
        // Since company_name is the person's name, we don't have organization info
        organization: null,
        department: null,
        // title could be their position, but it's often null
        position: supplier?.title || null,
        phone: supplier?.mobile || supplier?.phone || null,
      };
    }) || [];

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
