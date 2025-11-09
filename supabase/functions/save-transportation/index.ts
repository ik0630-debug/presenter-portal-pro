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
    const transportData = await req.json();
    const { session_id } = transportData;
    
    console.log('Saving transportation info for session:', session_id);

    // Connect to external Supabase
    const externalSupabase = createClient(
      Deno.env.get('EXTERNAL_SUPABASE_URL')!,
      Deno.env.get('EXTERNAL_SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Upsert transportation info
    const { data: result, error } = await externalSupabase
      .from('transportation_info')
      .upsert(transportData, {
        onConflict: 'session_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to save transportation:', error);
      throw error;
    }

    console.log('Successfully saved transportation:', result.id);

    return new Response(
      JSON.stringify({ transportation: result }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error: any) {
    console.error('Error in save-transportation:', error);
    return new Response(
      JSON.stringify({ 
        error: '교통 정보 저장 중 오류가 발생했습니다.',
        details: error?.message || 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
