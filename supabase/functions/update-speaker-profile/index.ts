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
    const { email, speaker_name, organization, department, position } = await req.json();
    
    console.log('Updating speaker profile for email:', email);

    // Connect to external Supabase
    const externalSupabase = createClient(
      Deno.env.get('EXTERNAL_SUPABASE_URL')!,
      Deno.env.get('EXTERNAL_SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Update speaker session in external DB
    const { data: session, error: updateError } = await externalSupabase
      .from('speaker_sessions')
      .update({
        speaker_name,
        organization,
        department,
        position,
      })
      .eq('email', email)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update profile:', updateError);
      throw updateError;
    }

    console.log('Successfully updated profile for session:', session.id);

    return new Response(
      JSON.stringify({ session }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error: any) {
    console.error('Error in update-speaker-profile:', error);
    return new Response(
      JSON.stringify({ 
        error: '프로필 업데이트 중 오류가 발생했습니다.',
        details: error?.message || 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
