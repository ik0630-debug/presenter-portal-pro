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

    // Get speakers from project_speakers table
    const { data: projectSpeakers, error: speakersError } = await externalSupabase
      .from('project_speakers')
      .select(`
        supplier_id,
        suppliers (
          id,
          name,
          email,
          organization,
          department,
          position,
          phone
        )
      `)
      .eq('project_id', projectId);

    if (speakersError) {
      console.error('Failed to fetch speakers:', speakersError);
      throw speakersError;
    }

    // Transform the data
    const speakers = projectSpeakers
      ?.filter((ps: any) => ps.suppliers)
      .map((ps: any) => ({
        id: ps.suppliers.id,
        name: ps.suppliers.name,
        email: ps.suppliers.email,
        organization: ps.suppliers.organization,
        department: ps.suppliers.department,
        position: ps.suppliers.position,
        phone: ps.suppliers.phone,
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
