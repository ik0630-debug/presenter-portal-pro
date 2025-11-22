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
    const { data: samplePS, error: psStructError } = await externalSupabase
      .from('project_speakers')
      .select('*')
      .eq('project_id', projectId)
      .limit(1)
      .maybeSingle();

    if (psStructError) {
      console.error('Error checking project_speakers structure:', psStructError);
    } else if (samplePS) {
      console.log('project_speakers columns:', Object.keys(samplePS));
      console.log('Sample project_speaker:', samplePS);
    }

    // Try to get speakers - we'll use the most common foreign key pattern
    // Try different possible foreign key column names
    let speakers: any[] = [];
    let joinError = null;

    // Attempt 1: Try with 'supplier_id' (most common)
    const { data: speakers1, error: error1 } = await externalSupabase
      .from('project_speakers')
      .select(`
        *,
        suppliers (
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

    if (!error1 && speakers1) {
      console.log('Successfully joined with suppliers table');
      console.log('Sample joined data:', speakers1[0]);
      
      speakers = speakers1
        .filter((ps: any) => ps.suppliers)
        .map((ps: any) => ({
          id: ps.suppliers.id,
          name: ps.suppliers.title || ps.suppliers.nickname || ps.suppliers.representative || ps.suppliers.company_name || 'Unknown',
          email: ps.suppliers.email || null,
          organization: ps.suppliers.company_name || null,
          department: null,
          position: ps.suppliers.title || null,
          phone: ps.suppliers.mobile || ps.suppliers.phone || null,
        }));
    } else {
      console.error('Failed to join with suppliers:', error1);
      joinError = error1;
      
      // If join failed, return project_speakers data directly
      const { data: directData } = await externalSupabase
        .from('project_speakers')
        .select('*')
        .eq('project_id', projectId);
      
      if (directData) {
        console.log('Falling back to direct project_speakers data');
        speakers = directData.map((ps: any) => ({
          id: ps.id,
          name: ps.speaker_name || ps.name || ps.title || 'Unknown',
          email: ps.email || ps.speaker_email || null,
          organization: ps.organization || ps.company || null,
          department: ps.department || null,
          position: ps.position || null,
          phone: ps.phone || ps.mobile || null,
        }));
      }
    }

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
