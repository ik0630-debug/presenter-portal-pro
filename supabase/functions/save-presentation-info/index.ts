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
    const { 
      session_id, 
      use_audio, 
      use_personal_laptop, 
      use_video, 
      special_requests, 
      custom_fields 
    } = await req.json();
    
    console.log('Saving presentation info for session:', session_id);

    // Connect to external Supabase
    const externalSupabase = createClient(
      Deno.env.get('EXTERNAL_SUPABASE_URL')!,
      Deno.env.get('EXTERNAL_SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check if presentation info exists
    const { data: existing } = await externalSupabase
      .from('presentation_info')
      .select('id')
      .eq('session_id', session_id)
      .maybeSingle();

    const infoData = {
      session_id,
      use_audio,
      use_personal_laptop,
      use_video,
      special_requests,
      custom_fields,
    };

    let result;
    if (existing) {
      // Update
      const { data, error } = await externalSupabase
        .from('presentation_info')
        .update(infoData)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
      console.log('Updated presentation info:', existing.id);
    } else {
      // Insert
      const { data, error } = await externalSupabase
        .from('presentation_info')
        .insert(infoData)
        .select()
        .single();

      if (error) throw error;
      result = data;
      console.log('Created presentation info:', result.id);
    }

    return new Response(
      JSON.stringify({ presentation_info: result }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error: any) {
    console.error('Error in save-presentation-info:', error);
    return new Response(
      JSON.stringify({ 
        error: '발표 정보 저장 중 오류가 발생했습니다.',
        details: error?.message || 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
