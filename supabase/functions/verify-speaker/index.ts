import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyRequest {
  email: string;
  speakerId: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, speakerId }: VerifyRequest = await req.json();

    if (!email || !speakerId) {
      return new Response(
        JSON.stringify({ error: '이메일과 발표자 ID를 입력해주세요.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Connect to external Supabase
    const externalSupabase = createClient(
      Deno.env.get('EXTERNAL_SUPABASE_URL')!,
      Deno.env.get('EXTERNAL_SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verify speaker in external DB
    const { data: supplier, error: supplierError } = await externalSupabase
      .from('suppliers')
      .select('id, name, email, professional_types')
      .eq('email', email)
      .contains('professional_types', ['speaker'])
      .single();

    if (supplierError || !supplier) {
      console.error('Speaker verification failed:', supplierError);
      return new Response(
        JSON.stringify({ error: '발표자 정보를 찾을 수 없습니다.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get speaker details from project_speakers
    const { data: projectSpeaker, error: projectError } = await externalSupabase
      .from('project_speakers')
      .select(`
        *,
        projects:project_id (
          name,
          event_date
        )
      `)
      .eq('supplier_id', supplier.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (projectError) {
      console.error('Project speaker fetch failed:', projectError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        speaker: {
          id: supplier.id,
          name: supplier.name,
          email: supplier.email,
          speakerId: speakerId,
          eventName: projectSpeaker?.projects?.name || '행사 정보 없음',
          presentationDate: projectSpeaker?.presentation_date || projectSpeaker?.projects?.event_date,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in verify-speaker:', error);
    return new Response(
      JSON.stringify({ error: '서버 오류가 발생했습니다.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
