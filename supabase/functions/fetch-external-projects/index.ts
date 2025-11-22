import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const EXTERNAL_SUPABASE_URL = Deno.env.get('EXTERNAL_SUPABASE_URL');
    const EXTERNAL_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsbHdzZWJwa3ZjdnFhY2dtdnNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NjQ0MzEsImV4cCI6MjA3NzM0MDQzMX0.buBXmNO0wl618u7WXxkg3fgi8vyU3XNH3rRQGCWmcJM';
    const EXTERNAL_SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('EXTERNAL_SUPABASE_SERVICE_ROLE_KEY');
    const EXTERNAL_ADMIN_EMAIL = Deno.env.get('EXTERNAL_ADMIN_EMAIL');
    const EXTERNAL_ADMIN_PASSWORD = Deno.env.get('EXTERNAL_ADMIN_PASSWORD');

    if (!EXTERNAL_SUPABASE_URL || !EXTERNAL_SUPABASE_SERVICE_ROLE_KEY || !EXTERNAL_ADMIN_EMAIL || !EXTERNAL_ADMIN_PASSWORD) {
      throw new Error('Missing required environment variables');
    }

    console.log('Creating external Supabase client...');
    
    // 외부 Supabase 클라이언트 생성
    const externalSupabase = createClient(
      EXTERNAL_SUPABASE_URL,
      EXTERNAL_SUPABASE_ANON_KEY
    );

    console.log('Logging in to external Supabase...');
    
    // 외부 Supabase에 관리자로 로그인
    const { data: authData, error: authError } = await externalSupabase.auth.signInWithPassword({
      email: EXTERNAL_ADMIN_EMAIL,
      password: EXTERNAL_ADMIN_PASSWORD,
    });

    if (authError) {
      console.error('Login error:', authError);
      throw authError;
    }

    if (!authData.session) {
      throw new Error('No session returned from login');
    }

    const jwtToken = authData.session.access_token;
    console.log('Successfully logged in, JWT token obtained');

    // 관리자 API 호출
    const apiUrl = `${EXTERNAL_SUPABASE_URL}/functions/v1/speaker-portal-admin/projects`;
    console.log('Calling admin API:', apiUrl);

    const response = await fetch(apiUrl, {
      headers: {
        'apikey': EXTERNAL_SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${EXTERNAL_SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API call failed:', response.status, errorText);
      throw new Error(`API call failed: ${response.status} ${errorText}`);
    }

    const projects = await response.json();
    console.log('Successfully fetched projects:', projects.length || 0);

    return new Response(
      JSON.stringify({ projects }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in fetch-external-projects:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
