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
    const { session_id, field_key, response } = await req.json();
    
    console.log('Saving attendance response:', { session_id, field_key, response });

    // Connect to external Supabase
    const externalSupabase = createClient(
      Deno.env.get('EXTERNAL_SUPABASE_URL')!,
      Deno.env.get('EXTERNAL_SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Upsert attendance response
    const { data: result, error } = await externalSupabase
      .from('attendance_responses')
      .upsert({
        session_id,
        field_key,
        response,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to save attendance response:', error);
      throw error;
    }

    console.log('Successfully saved attendance response:', result.id);

    return new Response(
      JSON.stringify({ attendance_response: result }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error: any) {
    console.error('Error in save-attendance-response:', error);
    return new Response(
      JSON.stringify({ 
        error: '참석 정보 저장 중 오류가 발생했습니다.',
        details: error?.message || 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
