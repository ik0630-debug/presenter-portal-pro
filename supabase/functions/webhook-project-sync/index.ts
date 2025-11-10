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
    console.log('Webhook received for project sync');
    
    const payload = await req.json();
    console.log('Webhook payload:', JSON.stringify(payload, null, 2));

    // Connect to local Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Connect to external Supabase
    const externalSupabase = createClient(
      Deno.env.get('EXTERNAL_SUPABASE_URL')!,
      Deno.env.get('EXTERNAL_SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Determine which project to sync based on webhook payload
    const projectId = payload.record?.id || payload.old_record?.id;
    
    if (!projectId) {
      console.log('No project ID found, syncing all projects');
      return await syncAllProjects(supabase, externalSupabase);
    }

    console.log(`Syncing specific project: ${projectId}`);
    return await syncSpecificProject(supabase, externalSupabase, projectId);

  } catch (error: any) {
    console.error('Error in webhook-project-sync:', error);
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

async function syncSpecificProject(
  supabase: any,
  externalSupabase: any,
  projectId: string
) {
  // Get the specific external project
  const { data: externalProject, error: externalError } = await externalSupabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (externalError) {
    console.error('Failed to fetch external project:', externalError);
    throw externalError;
  }

  // Check if project exists locally
  const { data: localProject, error: localError } = await supabase
    .from('projects')
    .select('id')
    .eq('external_project_id', projectId)
    .maybeSingle();

  if (localError && localError.code !== 'PGRST116') {
    console.error('Failed to check local project:', localError);
    throw localError;
  }

  let action = '';

  if (localProject) {
    // Update existing project
    const { error: updateError } = await supabase
      .from('projects')
      .update({
        project_name: externalProject.title,
        event_name: externalProject.title,
        description: externalProject.description,
        start_date: externalProject.start_date,
        end_date: externalProject.end_date,
        updated_at: new Date().toISOString(),
      })
      .eq('external_project_id', projectId);

    if (updateError) throw updateError;
    
    action = 'updated';
    console.log(`Updated project: ${externalProject.title}`);
  } else {
    // Create new project
    const slug = generateSlug(externalProject.title || projectId);
    
    const { error: insertError } = await supabase
      .from('projects')
      .insert({
        project_name: externalProject.title,
        event_name: externalProject.title,
        description: externalProject.description,
        start_date: externalProject.start_date,
        end_date: externalProject.end_date,
        external_project_id: projectId,
        slug: slug,
        is_active: true,
      });

    if (insertError) throw insertError;
    
    action = 'created';
    console.log(`Created new project: ${externalProject.title}`);
  }

  return new Response(
    JSON.stringify({ 
      success: true,
      action: action,
      projectId: projectId,
      projectName: externalProject.title
    }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

async function syncAllProjects(supabase: any, externalSupabase: any) {
  console.log('Syncing all projects...');

  const { data: externalProjects, error: externalError } = await externalSupabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (externalError) {
    console.error('Failed to fetch external projects:', externalError);
    throw externalError;
  }

  const { data: localProjects, error: localError } = await supabase
    .from('projects')
    .select('id, external_project_id')
    .not('external_project_id', 'is', null);

  if (localError) {
    console.error('Failed to fetch local projects:', localError);
    throw localError;
  }

  const existingExternalIds = new Set(
    localProjects?.map((p: any) => p.external_project_id) || []
  );

  let newCount = 0;
  let updatedCount = 0;

  for (const externalProject of externalProjects || []) {
    if (existingExternalIds.has(externalProject.id)) {
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          project_name: externalProject.title,
          event_name: externalProject.title,
          description: externalProject.description,
          start_date: externalProject.start_date,
          end_date: externalProject.end_date,
          updated_at: new Date().toISOString(),
        })
        .eq('external_project_id', externalProject.id);

      if (updateError) {
        console.error(`Failed to update project ${externalProject.id}:`, updateError);
      } else {
        updatedCount++;
      }
    } else {
      const slug = generateSlug(externalProject.title || externalProject.id);
      
      const { error: insertError } = await supabase
        .from('projects')
        .insert({
          project_name: externalProject.title,
          event_name: externalProject.title,
          description: externalProject.description,
          start_date: externalProject.start_date,
          end_date: externalProject.end_date,
          external_project_id: externalProject.id,
          slug: slug,
          is_active: true,
        });

      if (insertError) {
        console.error(`Failed to create project ${externalProject.id}:`, insertError);
      } else {
        newCount++;
      }
    }
  }

  return new Response(
    JSON.stringify({ 
      success: true,
      newProjects: newCount,
      updatedProjects: updatedCount,
      totalExternal: externalProjects?.length || 0
    }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
