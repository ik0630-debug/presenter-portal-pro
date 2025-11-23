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
    console.log('=== Debugging External DB ===');

    // Connect to external Supabase
    const externalSupabase = createClient(
      Deno.env.get('EXTERNAL_SUPABASE_URL')!,
      Deno.env.get('EXTERNAL_SUPABASE_SERVICE_ROLE_KEY')!
    );

    console.log('External URL:', Deno.env.get('EXTERNAL_SUPABASE_URL'));

    // 1. Check projects table
    console.log('\n--- Checking projects table ---');
    const { data: projects, error: projectsError } = await externalSupabase
      .from('projects')
      .select('*')
      .limit(5);

    if (projectsError) {
      console.error('Projects error:', projectsError);
    } else {
      console.log(`Found ${projects?.length || 0} projects`);
      console.log('Sample projects:', JSON.stringify(projects, null, 2));
    }

    // 2. Check project_speakers table
    console.log('\n--- Checking project_speakers table ---');
    const { data: projectSpeakers, error: speakersError } = await externalSupabase
      .from('project_speakers')
      .select('*')
      .limit(5);

    if (speakersError) {
      console.error('Project speakers error:', speakersError);
    } else {
      console.log(`Found ${projectSpeakers?.length || 0} project_speakers`);
      console.log('Sample project_speakers:', JSON.stringify(projectSpeakers, null, 2));
    }

    // 3. Check suppliers table (all types)
    console.log('\n--- Checking suppliers table ---');
    const { data: suppliers, error: suppliersError } = await externalSupabase
      .from('suppliers')
      .select('*')
      .limit(5);

    if (suppliersError) {
      console.error('Suppliers error:', suppliersError);
    } else {
      console.log(`Found ${suppliers?.length || 0} suppliers`);
      console.log('Sample suppliers:', JSON.stringify(suppliers, null, 2));
    }

    // 3-2. Check suppliers with company_type = 'speaker'
    console.log('\n--- Checking speaker suppliers ---');
    const { data: speakerSuppliers, error: speakerSuppliersError } = await externalSupabase
      .from('suppliers')
      .select('*')
      .eq('company_type', 'speaker')
      .limit(5);

    if (speakerSuppliersError) {
      console.error('Speaker suppliers error:', speakerSuppliersError);
    } else {
      console.log(`Found ${speakerSuppliers?.length || 0} speaker suppliers`);
      console.log('Sample speaker suppliers:', JSON.stringify(speakerSuppliers, null, 2));
    }

    // 4. Check professional_profiles table
    console.log('\n--- Checking professional_profiles table ---');
    const { data: profiles, error: profilesError } = await externalSupabase
      .from('professional_profiles')
      .select('*')
      .limit(5);

    if (profilesError) {
      console.error('Professional profiles error:', profilesError);
    } else {
      console.log(`Found ${profiles?.length || 0} professional_profiles`);
      console.log('Sample profiles:', JSON.stringify(profiles, null, 2));
    }

    // 5. Check speaker_sessions table (현재 앱)
    console.log('\n--- Checking speaker_sessions in external DB ---');
    const { data: sessions, error: sessionsError } = await externalSupabase
      .from('speaker_sessions')
      .select('*')
      .limit(5);

    if (sessionsError) {
      console.error('Speaker sessions error:', sessionsError);
    } else {
      console.log(`Found ${sessions?.length || 0} speaker_sessions`);
      console.log('Sample sessions:', JSON.stringify(sessions, null, 2));
    }

    return new Response(
      JSON.stringify({
        external_url: Deno.env.get('EXTERNAL_SUPABASE_URL'),
        projects: {
          count: projects?.length || 0,
          data: projects,
          error: projectsError?.message,
        },
        project_speakers: {
          count: projectSpeakers?.length || 0,
          data: projectSpeakers,
          error: speakersError?.message,
        },
        suppliers: {
          count: suppliers?.length || 0,
          data: suppliers,
          error: suppliersError?.message,
        },
        speaker_suppliers: {
          count: speakerSuppliers?.length || 0,
          data: speakerSuppliers,
          error: speakerSuppliersError?.message,
        },
        professional_profiles: {
          count: profiles?.length || 0,
          data: profiles,
          error: profilesError?.message,
        },
        speaker_sessions: {
          count: sessions?.length || 0,
          data: sessions,
          error: sessionsError?.message,
        },
      }, null, 2),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error: any) {
    console.error('Error in debug-external-db:', error);
    return new Response(
      JSON.stringify({ 
        error: '외부 DB 디버깅 중 오류가 발생했습니다.',
        details: error?.message || 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
