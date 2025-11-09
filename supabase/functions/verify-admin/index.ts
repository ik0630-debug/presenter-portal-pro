import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyAdminRequest {
  email: string;
  password: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password }: VerifyAdminRequest = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: '이메일과 비밀번호를 입력해주세요.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Connect to external Supabase
    const externalSupabase = createClient(
      Deno.env.get('EXTERNAL_SUPABASE_URL')!,
      Deno.env.get('EXTERNAL_SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Try to sign in to external DB
    const { data: authData, error: authError } = await externalSupabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return new Response(
        JSON.stringify({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has admin or master role in external DB
    const { data: userData, error: userError } = await externalSupabase
      .from('user_roles')
      .select('role')
      .eq('user_id', authData.user.id)
      .in('role', ['admin', 'master'])
      .single();

    if (userError || !userData) {
      return new Response(
        JSON.stringify({ error: '관리자 권한이 없습니다.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current Supabase instance
    const localSupabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Create or update user in local auth
    const { data: localAuthData, error: localAuthError } = await localSupabase.auth.admin.createUser({
      email: authData.user.email!,
      email_confirm: true,
      user_metadata: {
        external_user_id: authData.user.id,
        role: userData.role,
      },
    });

    // If user already exists, try to get them
    let localUserId = localAuthData?.user?.id;
    if (localAuthError && localAuthError.message.includes('already registered')) {
      const { data: existingUser } = await localSupabase.auth.admin.listUsers();
      const user = existingUser?.users.find(u => u.email === email);
      if (user) {
        localUserId = user.id;
      }
    }

    if (!localUserId) {
      return new Response(
        JSON.stringify({ error: '로컬 사용자 생성 실패' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sync to admin_users table
    const adminRole = userData.role === 'master' ? 'super_admin' : 'admin';
    const { error: adminError } = await localSupabase
      .from('admin_users')
      .upsert({
        user_id: localUserId,
        email: authData.user.email!,
        role: adminRole,
      }, {
        onConflict: 'user_id',
      });

    if (adminError) {
      console.error('Admin user sync error:', adminError);
    }

    // Generate session for local Supabase
    const { data: sessionData, error: sessionError } = await localSupabase.auth.admin.generateLink({
      type: 'magiclink',
      email: authData.user.email!,
    });

    if (sessionError || !sessionData) {
      return new Response(
        JSON.stringify({ error: '세션 생성 실패' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: localUserId,
          email: authData.user.email,
          role: adminRole,
        },
        session: sessionData,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in verify-admin:', error);
    return new Response(
      JSON.stringify({ error: '서버 오류가 발생했습니다.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
