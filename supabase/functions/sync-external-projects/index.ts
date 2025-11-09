import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

Deno.serve(async (req) => {
  try {
    console.log('Starting automatic external project sync...');

    // Connect to both databases
    const externalSupabase = createClient(
      Deno.env.get('EXTERNAL_SUPABASE_URL')!,
      Deno.env.get('EXTERNAL_SUPABASE_SERVICE_ROLE_KEY')!
    );

    const localSupabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get all projects from external DB
    const { data: externalProjects, error: fetchError } = await externalSupabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Failed to fetch external projects:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${externalProjects?.length || 0} external projects`);

    let syncedCount = 0;
    let skippedCount = 0;

    // Sync each project
    for (const extProject of externalProjects || []) {
      // Check if project already exists (by checking if we have a speaker with this external supplier ID)
      const { data: existingSpeakers } = await localSupabase
        .from('speaker_sessions')
        .select('id')
        .eq('external_supplier_id', extProject.id)
        .limit(1);

      if (existingSpeakers && existingSpeakers.length > 0) {
        console.log(`Project ${extProject.id} already synced, skipping`);
        skippedCount++;
        continue;
      }

      // Get speakers for this project from external DB
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

      // Create project in local DB
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
        console.error(`Failed to create project ${extProject.id}:`, projectError);
        continue;
      }

      console.log(`Created project ${newProject.id} for external project ${extProject.id}`);

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
        const { error: speakersError } = await localSupabase
          .from('speaker_sessions')
          .insert(speakers);

        if (speakersError) {
          console.error(`Failed to create speakers for project ${extProject.id}:`, speakersError);
        } else {
          console.log(`Created ${speakers.length} speakers for project ${newProject.id}`);
          syncedCount++;
        }
      } else {
        console.log(`No speakers found for project ${extProject.id}`);
        syncedCount++;
      }
    }

    console.log(`Sync complete: ${syncedCount} synced, ${skippedCount} skipped`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        synced: syncedCount, 
        skipped: skippedCount,
        message: `동기화 완료: ${syncedCount}개 동기화됨, ${skippedCount}개 건너뜀`
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  } catch (error: any) {
    console.error('Error in sync-external-projects:', error);
    return new Response(
      JSON.stringify({ 
        error: '자동 동기화 중 오류가 발생했습니다.',
        details: error?.message || 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
});
