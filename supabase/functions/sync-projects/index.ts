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
    console.log('Starting project synchronization...');

    // Connect to local Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Connect to external Supabase
    const externalSupabase = createClient(
      Deno.env.get('EXTERNAL_SUPABASE_URL')!,
      Deno.env.get('EXTERNAL_SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get external projects
    const { data: externalProjects, error: externalError } = await externalSupabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (externalError) {
      console.error('Failed to fetch external projects:', externalError);
      throw externalError;
    }

    console.log(`Found ${externalProjects?.length || 0} external projects`);

    // Get existing local projects with external_project_id
    const { data: localProjects, error: localError } = await supabase
      .from('projects')
      .select('id, external_project_id')
      .not('external_project_id', 'is', null);

    if (localError) {
      console.error('Failed to fetch local projects:', localError);
      throw localError;
    }

    const existingExternalIds = new Set(
      localProjects?.map(p => p.external_project_id) || []
    );

    let newCount = 0;
    let updatedCount = 0;

    // Process each external project
    for (const externalProject of externalProjects || []) {
      if (existingExternalIds.has(externalProject.id)) {
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
          .eq('external_project_id', externalProject.id);

        if (updateError) {
          console.error(`Failed to update project ${externalProject.id}:`, updateError);
        } else {
          updatedCount++;
          console.log(`Updated project: ${externalProject.title}`);
        }
      } else {
        // Create new project with auto-generated slug
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
          console.log(`Created new project: ${externalProject.title}`);
        }
      }
    }

    console.log(`Synchronization complete. New: ${newCount}, Updated: ${updatedCount}`);

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
  } catch (error: any) {
    console.error('Error in sync-projects:', error);
    return new Response(
      JSON.stringify({ 
        error: '프로젝트 동기화 중 오류가 발생했습니다.',
        details: error?.message || 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
