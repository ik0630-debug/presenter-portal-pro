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
    const { email } = await req.json();
    
    console.log('Fetching speaker session for email:', email);

    // Connect to external Supabase
    const externalSupabase = createClient(
      Deno.env.get('EXTERNAL_SUPABASE_URL')!,
      Deno.env.get('EXTERNAL_SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get speaker session from external DB
    const { data: session, error: sessionError } = await externalSupabase
      .from('speaker_sessions')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (sessionError) {
      console.error('Failed to fetch session:', sessionError);
      throw sessionError;
    }

    if (!session) {
      return new Response(
        JSON.stringify({ error: '해당 이메일의 발표자 세션을 찾을 수 없습니다.' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Successfully fetched session:', session.id);

    return new Response(
      JSON.stringify({ session }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error: any) {
    console.error('Error in get-speaker-session:', error);
    return new Response(
      JSON.stringify({ 
        error: '세션 정보를 가져오는 중 오류가 발생했습니다.',
        details: error?.message || 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
