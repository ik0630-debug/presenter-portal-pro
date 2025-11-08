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
    const { speakerId } = await req.json();

    if (!speakerId) {
      return new Response(
        JSON.stringify({ error: 'Speaker ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Connect to external Supabase
    const externalSupabase = createClient(
      Deno.env.get('EXTERNAL_SUPABASE_URL')!,
      Deno.env.get('EXTERNAL_SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get speaker and project information
    const { data: projectSpeaker, error } = await externalSupabase
      .from('project_speakers')
      .select(`
        *,
        projects:project_id (
          name,
          event_date,
          venue
        ),
        suppliers:supplier_id (
          name,
          email
        )
      `)
      .eq('supplier_id', speakerId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !projectSpeaker) {
      console.error('Failed to fetch organizer info:', error);
      return new Response(
        JSON.stringify({ error: '주최측 정보를 찾을 수 없습니다.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        eventName: projectSpeaker.projects?.name || '행사 정보 없음',
        date: projectSpeaker.projects?.event_date,
        time: projectSpeaker.presentation_time || '14:00 - 14:45',
        venue: projectSpeaker.projects?.venue || '장소 미정',
        arrivalTime: projectSpeaker.arrival_time || '13:30까지 도착 요청',
        honorarium: projectSpeaker.honorarium || '500,000원',
        contact: {
          name: '담당자 정보',
          phone: projectSpeaker.contact_phone || '02-1234-5678',
          email: projectSpeaker.contact_email || 'contact@conference.com',
        },
        attendees: projectSpeaker.expected_attendees || '약 500명',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-organizer-info:', error);
    return new Response(
      JSON.stringify({ error: '서버 오류가 발생했습니다.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
