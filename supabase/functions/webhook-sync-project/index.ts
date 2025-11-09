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
    const { project_id, action } = await req.json();
    console.log(`Webhook received: ${action} for project ${project_id}`);

    const externalSupabase = createClient(
      Deno.env.get('EXTERNAL_SUPABASE_URL')!,
      Deno.env.get('EXTERNAL_SUPABASE_SERVICE_ROLE_KEY')!
    );

    const localSupabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch the specific project from external DB
    const { data: extProject, error: fetchError } = await externalSupabase
      .from('projects')
      .select('*')
      .eq('id', project_id)
      .single();

    if (fetchError) {
      console.error('Failed to fetch external project:', fetchError);
      throw fetchError;
    }

    // Check if already synced
    const { data: existingSpeakers } = await localSupabase
      .from('speaker_sessions')
      .select('id')
      .eq('external_supplier_id', extProject.id)
      .limit(1);

    if (action === 'DELETE') {
      // Delete local project and speakers
      if (existingSpeakers && existingSpeakers.length > 0) {
        await localSupabase
          .from('speaker_sessions')
          .delete()
          .eq('external_supplier_id', extProject.id);
        
        console.log(`Deleted speakers for project ${project_id}`);
      }
      
      return new Response(
        JSON.stringify({ success: true, message: '프로젝트 삭제 동기화 완료' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get speakers for this project
    const { data: projectSpeakers } = await externalSupabase
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
      .eq('project_id', extProject.id);

    if (existingSpeakers && existingSpeakers.length > 0) {
      // Update existing project
      const { data: existingProject } = await localSupabase
        .from('speaker_sessions')
        .select('project_id')
        .eq('external_supplier_id', extProject.id)
        .limit(1)
        .single();

      if (existingProject) {
        await localSupabase
          .from('projects')
          .update({
            project_name: `[외부] ${extProject.id}`,
            event_name: extProject.event_name || extProject.name || '외부 프로젝트',
            description: extProject.description,
            start_date: extProject.event_date || extProject.start_date,
          })
          .eq('id', existingProject.project_id);

        console.log(`Updated project ${existingProject.project_id}`);
      }
    } else {
      // Create new project
      const { data: newProject, error: projectError } = await localSupabase
        .from('projects')
        .insert({
          project_name: `[외부] ${extProject.id}`,
          event_name: extProject.event_name || extProject.name || '외부 프로젝트',
          description: extProject.description,
          start_date: extProject.event_date || extProject.start_date,
          is_active: true,
        })
        .select()
        .single();

      if (projectError) {
        console.error('Failed to create project:', projectError);
        throw projectError;
      }

      // Create speaker sessions
      const speakers = (projectSpeakers || [])
        .filter((ps: any) => ps.suppliers)
        .map((ps: any) => ({
          project_id: newProject.id,
          speaker_id: ps.suppliers.id,
          speaker_name: ps.suppliers.name,
          email: ps.suppliers.email,
          event_name: newProject.event_name,
          external_supplier_id: extProject.id,
          presentation_date: ps.presentation_time,
        }));

      if (speakers.length > 0) {
        await localSupabase
          .from('speaker_sessions')
          .insert(speakers);

        console.log(`Created ${speakers.length} speakers for new project`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: '실시간 동기화 완료' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in webhook-sync-project:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Webhook 처리 중 오류가 발생했습니다.',
        details: error?.message || 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
