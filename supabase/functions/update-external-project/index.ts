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
    const { id, project_name, event_name, description, start_date, end_date, is_active } = await req.json();
    
    console.log('Updating external project:', { id, project_name, event_name });

    // Connect to external Supabase
    const externalSupabase = createClient(
      Deno.env.get('EXTERNAL_SUPABASE_URL')!,
      Deno.env.get('EXTERNAL_SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Update project in external DB
    const { data: project, error: projectError } = await externalSupabase
      .from('projects')
      .update({
        project_name,
        event_name,
        description,
        start_date,
        end_date,
        is_active,
      })
      .eq('id', id)
      .select()
      .single();

    if (projectError) {
      console.error('Failed to update project:', projectError);
      throw projectError;
    }

    console.log('Successfully updated project:', project.id);

    return new Response(
      JSON.stringify({ project }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error: any) {
    console.error('Error in update-external-project:', error);
    return new Response(
      JSON.stringify({ 
        error: '프로젝트 수정 중 오류가 발생했습니다.',
        details: error?.message || 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
