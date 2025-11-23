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

    // Join project_speakers with suppliers and professional_profiles
    const { data: projectSpeakers, error: fetchError } = await externalSupabase
      .from('project_speakers')
      .select(`
        id,
        speaker_id,
        suppliers!project_speakers_speaker_id_fkey (
          id,
          company_name,
          nickname,
          representative,
          title,
          email,
          mobile,
          phone,
          professional_profiles!professional_profiles_supplier_id_fkey (
            organization,
            department,
            title
          )
        )
      `)
      .eq('project_id', projectId);

    if (fetchError) {
      console.error('Failed to fetch project speakers:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${projectSpeakers?.length || 0} project_speakers`);
    if (projectSpeakers && projectSpeakers.length > 0) {
      console.log('First joined speaker:', JSON.stringify(projectSpeakers[0], null, 2));
      const firstSupplier = projectSpeakers[0].suppliers as any;
      const firstProfile = firstSupplier?.professional_profiles?.[0];
      console.log('Professional profile check:', {
        has_supplier: !!firstSupplier,
        has_professional_profiles: !!firstSupplier?.professional_profiles,
        profile_count: firstSupplier?.professional_profiles?.length || 0,
        profile_data: firstProfile
      });
    }

    // Transform the data using the joined suppliers and professional_profiles tables
    const speakers = projectSpeakers?.map((ps: any) => {
      const supplier = ps.suppliers;
      // professional_profiles is returned as an object (not array) when using foreign key join
      const profile = supplier?.professional_profiles || {};
      
      console.log('Processing speaker:', {
        supplier_id: supplier?.id,
        has_professional_profiles: !!supplier?.professional_profiles,
        profile_data: profile
      });
      
      return {
        id: supplier?.id || ps.speaker_id,
        // Use company_name as the primary name source (it contains person's name)
        name: supplier?.company_name || supplier?.nickname || supplier?.representative || supplier?.title || 'Unknown',
        email: supplier?.email || null,
        // Access professional_profiles fields
        organization: profile.organization || null,
        department: profile.department || null,
        position: profile.title || supplier?.title || null,
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
