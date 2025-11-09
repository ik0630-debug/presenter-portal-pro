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
      custom_consents, 
      signature_data_url,
      user_id 
    } = await req.json();
    
    console.log('Saving consent for session:', session_id);

    // Connect to external Supabase
    const externalSupabase = createClient(
      Deno.env.get('EXTERNAL_SUPABASE_URL')!,
      Deno.env.get('EXTERNAL_SUPABASE_SERVICE_ROLE_KEY')!
    );

    let signaturePath = null;

    // Upload signature if provided
    if (signature_data_url) {
      const response = await fetch(signature_data_url);
      const blob = await response.blob();
      const fileName = `${user_id}/${session_id}_${Date.now()}.png`;

      const { error: uploadError } = await externalSupabase.storage
        .from('consent-signatures')
        .upload(fileName, blob, {
          contentType: 'image/png',
          upsert: true
        });

      if (!uploadError) {
        signaturePath = fileName;
      }
    }

    // Check if consent record exists
    const { data: existing } = await externalSupabase
      .from('consent_records')
      .select('id')
      .eq('session_id', session_id)
      .maybeSingle();

    const consentData = {
      session_id,
      custom_consents,
      signature_image_path: signaturePath,
      consent_date: new Date().toISOString(),
    };

    let result;
    if (existing) {
      const { data, error } = await externalSupabase
        .from('consent_records')
        .update(consentData)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
      console.log('Updated consent:', existing.id);
    } else {
      const { data, error } = await externalSupabase
        .from('consent_records')
        .insert(consentData)
        .select()
        .single();

      if (error) throw error;
      result = data;
      console.log('Created consent:', result.id);
    }

    return new Response(
      JSON.stringify({ consent: result }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error: any) {
    console.error('Error in save-consent:', error);
    return new Response(
      JSON.stringify({ 
        error: '동의서 저장 중 오류가 발생했습니다.',
        details: error?.message || 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
